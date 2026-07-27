import React from 'react';
import moment from 'moment';
import Toast, { ToastType, ToastPosition, } from 'react-native-toast-message';
import EncryptedStorage from 'react-native-encrypted-storage';
import { Dimensions, PixelRatio, Platform, Alert, Linking, TextStyle, } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { Constants } from '../config/constants';
import { check, request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';
// import messaging from "@react-native-firebase/messaging";
import Share from 'react-native-share';

export const deviceWidth = Math.round(Dimensions.get('window').width);
export const deviceHeight = Math.round(Dimensions.get('window').height);
const scale = deviceWidth / 375

const Utils = {

    getItem: async (key: string) => {
        try {
            const item = await EncryptedStorage.getItem(key);
            if (item && typeof item != 'undefined' && item != '') {
                return Utils.isJSONString(item) ? typeof JSON.parse(item) == 'number' ? item.toString() :
                    JSON.parse(item) : item;
            } else {
                return '';
            }
        } catch (e) {
            console.log('Failed to fetch the data from storage', key);
        }
    },

    deleteItem: async (key: string) => {
        try {
            await EncryptedStorage.removeItem(key);
        } catch (e) {
            console.log('Failed to clear the async storage.', key);
        }
    },

    deleteAllItem: async () => {
        try {
            await EncryptedStorage.clear();
        } catch (e) {
            console.log('Failed to clear all the async storage.');
        }
    },

    setItem: async (key: string, value: string) => {
        try {
            await EncryptedStorage.setItem(key, typeof value == 'string' ? value : JSON.stringify(value));
        } catch (e) {
            console.log('Failed to save the data to the storage', key);
        }
    },

    setToken: async (token: string) => {
        await Utils.setItem('authToken', token)
    },

    getToken: async () => {
        return await Utils.getItem('authToken');
    },

    getUser: async () => {
        return await Utils.getItem('user');
    },

    // getFCMToken: async () => {
    //     try {
    //         return await messaging().getToken();
    //     } catch (error) {
    //         return '';
    //     }
    // },

    jsonParse: (value: any) => {
        try {
            return JSON.parse(value);
        } catch (e) {
            console.log('Failed to parse >>> ', value);
            return value;
        }
    },

    isJSONString(value: string): boolean {
        try {
            JSON.parse(value);
            return true;
        } catch (e) {
            return false;
        }
    },

    normalize: (size: number) => {
        const newSize = size * scale
        if (Platform.OS === 'ios') {
            return Math.round(PixelRatio.roundToNearestPixel(newSize))
        } else {
            return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1
        }
    },

    isValidString: (text: string | undefined | null) => {
        return Boolean((text != '') && (typeof text != 'undefined') && (text != null))
    },

    isValidMail: (text: string) => {
        return String(text).toLowerCase().match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
    },
   
    getOnlyNumber: (value: string) => {
        return value.replace(/[^0-9]+/g, '');
    },

    getAlphanumeric: (value: string) => {
        return value.replace(/[^a-zA-Z0-9]/g, '');
    },

    formatSecondsMMSS: (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    },

    rateApp: (iosUrl?: string, androidUrl?: string) => {
        const defaultUrl = Platform.select({
            ios: `itms-apps://itunes.apple.com/app/id${Constants.iosAppId}?mt=8`,
            android: `market://details?id=${Constants.androidPackageName}`,
        });
        const url = Platform.select({ ios: iosUrl ?? defaultUrl, android: androidUrl ?? defaultUrl, });
        if (url) { Linking.openURL(url).catch((err) => console.error('Failed to open app store URL:', err)); }
    },

    shareApp: async (getMessage?: string) => {
        const iosAppUrl = `https://apps.apple.com/app/id${Constants.iosAppId}`;
        const androidAppUrl = `https://play.google.com/store/apps/details?id=${Constants.androidPackageName}`;
        const message = ''
            // getMessage ??
            // `${t('utils.shareAppMessage')}\n\n${t('utils.forIos')} ${iosAppUrl}\n${t('utils.forAndroid')} ${androidAppUrl}`;
    
        try {
            if (Platform.OS === 'android') {
                // Android-specific SMS Intent
                const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
                await Linking.openURL(smsUrl);
                console.log('App shared successfully via SMS on Android');
            } else {
                // iOS-specific SMS scheme
                const smsUrl = `sms:&body=${encodeURIComponent(message)}`;
                const smsSupported = await Linking.canOpenURL(smsUrl);
                if (smsSupported) {
                    await Linking.openURL(smsUrl);
                    console.log('App shared successfully via SMS on iOS');
                } else {
                    await Share.open({ message });
                    console.log('App shared successfully via other options');
                }
            }
        } catch (error: any) {
            if (error.message !== 'User did not share') {
                console.error('Failed to share app via SMS:', error);
            } else {
                console.log('Share cancelled by user');
            }
        }
    },
    
    emailShareApp: async ( getMessage?: string) => {
        const iosAppUrl = `https://apps.apple.com/app/id${Constants.iosAppId}`;
        const androidAppUrl = `https://play.google.com/store/apps/details?id=${Constants.androidPackageName}`;
        const message = ''
            // getMessage ??
            // `${t('utils.shareAppMessage')}\n\n${t('utils.forIos')} ${iosAppUrl}\n${t('utils.forAndroid')} ${androidAppUrl}`;
    
        const emailSubject = 'Check out this app!';
    
        try {
            if (Platform.OS === 'android') {
                // Android-specific Email Intent
                const emailUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(message)}`;
                await Linking.openURL(emailUrl);
                console.log('App shared successfully via Email on Android');
            } else {
                // iOS-specific Email scheme
                const emailUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(message)}`;
                const emailSupported = await Linking.canOpenURL(emailUrl);
                if (emailSupported) {
                    await Linking.openURL(emailUrl);
                    console.log('App shared successfully via Email on iOS');
                } else {
                    await Share.open({ message });
                    console.log('App shared successfully via other options');
                }
            }
        } catch (error: any) {
            if (error.message !== 'User did not share') {
                console.error('Failed to share app via Email:', error);
            } else {
                console.log('Share cancelled by user');
            }
        }
    },

    logout: async (navigation: any) => {
        Utils.deleteItem('authToken');
        Utils.deleteItem('user');
        // Don't automatically reset navigation - let UserContext handle logout
        // navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }], }));
    },

    showToast: (props: {
        text1: string | undefined, text2?: string, type?: ToastType, position?: ToastPosition,
        autoHide?: boolean, visibilityTime?: number, text1Style?: TextStyle, text2Style?: TextStyle
    }) => {
        const { text1, text2, text1Style, text2Style, autoHide, position, type, visibilityTime } = props
        Utils.isValidString(text1) && Toast.show({
            text1: text1,
            text2: text2,
            text1Style: text1Style,
            text2Style: text2Style,
            autoHide: autoHide,
            position: position ?? 'top',
            type: type,
            visibilityTime: visibilityTime ?? 3000,
        })
    },

    getCameraPermission: () => {
        if (Platform.OS === 'ios') {
            return PERMISSIONS.IOS.CAMERA;
        } else if (Platform.OS === 'android') {
            return PERMISSIONS.ANDROID.CAMERA;
        }
        return null;
    },

    getGalleryPermission: () => {
        if (Platform.OS === 'ios') {
            return PERMISSIONS.IOS.PHOTO_LIBRARY;
        } else if (Platform.OS === 'android') {
            return Platform.Version >= 31 ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
        }
        return null;
    },

    getLanguageCode: (text: string) => {
        switch (text) {
            case 'English':
                return 'en'
            case 'Français':
                return 'fr'
            case 'العربية':
                return 'ar'
            default:
                return 'en'
        }
    },

    formatDateYYYY_MM_DD: (date: string) => {
        const temp = new Date(date);
        const year = temp.getFullYear();
        const day = String(temp.getDate()).padStart(2, '0');
        const month = String(temp.getMonth() + 1).padStart(2, '0');
        return `${year}-${day}-${month}`;
        // return moment(date).format('yyyy-DD-MM');
    },

    isTokenExpired: (error: string) => {
        return Boolean(error == "Token must be present to access this request." || error == 'Token expired!')
    },

    getPageSize: (count: number): number => {
        const pageSize = Math.ceil(count / 10) * 10; // Rounds up to the nearest multiple of 10
        return pageSize > count ? pageSize : count + 10; // Ensures page size is always greater than count
    },

    toUpperCase: (title: string) => {
        return title.replace(/\b\w/g, (char) => char.toUpperCase());
    },

    checkFile: (path: string) => {
        const isIOS = Platform.OS === 'ios';
        if (isIOS) {
            return path.replace(/^file:\/\//, '');
        } else if (path.startsWith('file://')) {
            return path;
        } else {
            return `file://${path}`;
        }
    },

    isSafeAreaViewScreen: () => {
        return Boolean(Platform.OS === 'ios' || (Platform.OS === 'android' && Platform.Version >= 34));
    },

    gotoWebApp: async (webToken: string) => {
        const webUrl = `${Constants.webDevUrl}${webToken}`;
        console.log('webUrl >>>> ', webUrl)
        await Linking.openURL(webUrl);
    },

}

export default Utils;