import React from 'react';
import { Platform, Text, TouchableOpacity } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import Purchases, {
  INTRO_ELIGIBILITY_STATUS,
  PRODUCT_CATEGORY,
  PURCHASES_ERROR_CODE,
  type PurchasesOfferings,
  type PurchasesStoreProduct,
  type SubscriptionOption,
} from 'react-native-purchases';
import PaywallScreen from '../src/screens/PaywallScreen';

jest.mock('react-native-purchases', () => ({
  ...jest.requireActual('@revenuecat/purchases-typescript-internal'),
  __esModule: true,
  default: {
    getOfferings: jest.fn(),
    getProducts: jest.fn(),
    checkTrialOrIntroductoryPriceEligibility: jest.fn(),
    purchaseStoreProduct: jest.fn(),
    purchaseSubscriptionOption: jest.fn(),
    getAppUserID: jest.fn(),
    restorePurchases: jest.fn(),
  },
}));
jest.mock('@superwall/react-native-superwall', () => ({
  __esModule: true,
  default: { shared: { setSubscriptionStatus: jest.fn() } },
  SubscriptionStatus: { Active: jest.fn() },
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: require('react-native').View,
}));
jest.mock('../src/components/ui/icons', () => ({
  Check: () => null,
  ChevronRight: () => null,
  Lock: () => null,
}));
jest.mock('../app/helpers/ApiHelper', () => ({
  refreshServerSubscription: jest.fn().mockResolvedValue({}),
}));

const purchases = jest.mocked(Purchases);
const originalOS = Platform.OS;
const navigation = { goBack: jest.fn(), navigate: jest.fn() };
let screen: TestRenderer.ReactTestRenderer | undefined;

function product(identifier: string, subscriptionPeriod: string, price: number) {
  return {
    identifier,
    subscriptionPeriod,
    price,
    priceString: `$${price.toFixed(2)}`,
    productCategory: PRODUCT_CATEGORY.SUBSCRIPTION,
    introPrice: null,
    subscriptionOptions: null,
    defaultOption: null,
  } as PurchasesStoreProduct;
}

// Product IDs from the live Apple low_tier offering, not Play Console IDs.
const monthly = product('com.monthly.low', 'P1M', 5.99);
const weekly = product('com.weekly.low', 'P1W', 1.99);
const yearly = product('com.yearly.low', 'P1Y', 59.99);

function offering(products: PurchasesStoreProduct[]): PurchasesOfferings {
  return {
    current: {
      identifier: 'low_tier',
      availablePackages: products.map(item => ({ product: item })),
    },
    all: {},
  } as PurchasesOfferings;
}

function texts() {
  return screen!.root.findAllByType(Text).map(node => node.props.children);
}

function subscribeButton() {
  return screen!.root.findAllByType(TouchableOpacity).find(node =>
    node.props.accessibilityRole === 'button' &&
    node.props.accessibilityLabel !== 'Close',
  )!;
}

async function render() {
  await act(async () => {
    screen = TestRenderer.create(<PaywallScreen navigation={navigation} route={{}} />);
  });
}

beforeEach(() => {
  jest.resetAllMocks();
  Platform.OS = 'ios';
  purchases.getOfferings.mockResolvedValue(offering([yearly, weekly, monthly]));
  purchases.getProducts.mockResolvedValue([]);
  purchases.getAppUserID.mockResolvedValue('test-member');
});

afterEach(async () => {
  await act(async () => screen?.unmount());
  screen = undefined;
  Platform.OS = originalOS;
});

test('loads the current Apple offering and enables Subscribe with accurate billing periods', async () => {
  await render();

  expect(purchases.getProducts).not.toHaveBeenCalled();
  expect(texts()).toEqual(expect.arrayContaining([
    'Weekly', '$1.99 per week', 'Monthly', '$5.99 per month',
    'Yearly', '$59.99 per year', 'Save 17%',
  ]));
  expect(subscribeButton().props.disabled).toBe(false);
  expect(purchases.checkTrialOrIntroductoryPriceEligibility).not.toHaveBeenCalled();
});

test('purchases the selected Apple product through the App Store path', async () => {
  purchases.purchaseStoreProduct.mockResolvedValue({
    customerInfo: { entitlements: { active: { premium: {} } } },
  } as any);
  await render();

  await act(async () => subscribeButton().props.onPress());

  expect(purchases.purchaseStoreProduct).toHaveBeenCalledWith(yearly);
  expect(purchases.purchaseSubscriptionOption).not.toHaveBeenCalled();
  expect(navigation.goBack).toHaveBeenCalled();
});

test('uses store billing periods even when the product identifier suggests another period', async () => {
  purchases.getOfferings.mockResolvedValue(offering([
    product('annual_legacy_name', 'P1W', 1.99),
  ]));
  await render();
  expect(texts()).toContain('$1.99 per week');
  expect(texts()).not.toContain('Yearly');
});

test('does not fall back to another price tier when there is no current offering', async () => {
  purchases.getOfferings.mockResolvedValue({
    current: null,
    all: { other: offering([yearly]).current! },
  });
  await render();

  expect(subscribeButton().props.disabled).toBe(true);
  expect(texts()).toContain('Subscription plans are currently unavailable. Please try again later.');
  expect(purchases.getProducts).not.toHaveBeenCalled();
});

test('recovers from an empty offering when Try again returns Apple plans', async () => {
  purchases.getOfferings.mockResolvedValueOnce(offering([]));
  await render();
  expect(subscribeButton().props.disabled).toBe(true);

  const retry = screen!.root.findAllByType(TouchableOpacity).find(node =>
    node.findAllByType(Text).some(label => label.props.children === 'Try again'),
  )!;
  await act(async () => retry.props.onPress());

  expect(subscribeButton().props.disabled).toBe(false);
  expect(texts()).toContain('$5.99 per month');
});

test.each([
  [PURCHASES_ERROR_CODE.NETWORK_ERROR, 'We could not connect to the store. Check your connection and try again.'],
  [PURCHASES_ERROR_CODE.CONFIGURATION_ERROR, 'Subscription plans are currently unavailable. Please try again later.'],
])('reports store error %s without enabling a purchase', async (code, message) => {
  purchases.getOfferings.mockRejectedValue({ code });
  await render();
  expect(texts()).toContain(message);
  expect(subscribeButton().props.disabled).toBe(true);
});

const trialProduct = {
  ...monthly,
  introPrice: { price: 0, periodUnit: 'DAY', periodNumberOfUnits: 7 },
} as PurchasesStoreProduct;

test.each([
  [INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE, true],
  [INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_INELIGIBLE, false],
  [INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_UNKNOWN, false],
])('only advertises an Apple trial when eligibility is confirmed (%s)', async (status, showTrial) => {
  purchases.getOfferings.mockResolvedValue(offering([trialProduct]));
  purchases.checkTrialOrIntroductoryPriceEligibility.mockResolvedValue({
    [monthly.identifier]: { status, description: '' },
  });
  await render();

  expect(purchases.checkTrialOrIntroductoryPriceEligibility).toHaveBeenCalledWith([monthly.identifier]);
  expect(texts().includes('Start my 7-day free trial')).toBe(showTrial);
  expect(subscribeButton().props.disabled).toBe(false);
});

test('still allows a subscription when the Apple trial eligibility check fails', async () => {
  purchases.getOfferings.mockResolvedValue(offering([trialProduct]));
  purchases.checkTrialOrIntroductoryPriceEligibility.mockRejectedValue(new Error('unavailable'));
  await render();

  expect(texts()).toContain('Subscribe');
  expect(subscribeButton().props.disabled).toBe(false);
});

test('preserves Android product IDs and purchases the free-trial subscription option', async () => {
  Platform.OS = 'android';
  const option = {
    id: 'monthly-trial',
    freePhase: { billingPeriod: { unit: 'DAY', value: 7 } },
    fullPricePhase: { billingPeriod: { unit: 'MONTH', value: 1 } },
  } as SubscriptionOption;
  purchases.getProducts.mockResolvedValue([{
    ...product('monthly_099', 'P1M', 5.99),
    subscriptionOptions: [option],
    defaultOption: option,
  }]);
  purchases.purchaseSubscriptionOption.mockResolvedValue({
    customerInfo: { entitlements: { active: { premium: {} } } },
  } as any);
  await render();

  expect(purchases.getProducts).toHaveBeenCalledWith(['monthly_099', 'annual'], PRODUCT_CATEGORY.SUBSCRIPTION);
  expect(purchases.getOfferings).not.toHaveBeenCalled();
  expect(texts()).toContain('Start my 7-day free trial');
  await act(async () => subscribeButton().props.onPress());
  expect(purchases.purchaseSubscriptionOption).toHaveBeenCalledWith(option);
  expect(purchases.purchaseStoreProduct).not.toHaveBeenCalled();
});
