import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { checkSubscriptionAndProceed } from '../services/subscriptionService';
import { useUser } from '../context/UserContext';
import LockIcon from '../../assets/icons/lock.svg';
import { getFontFamily } from '../utils/platform';

const { width } = Dimensions.get('window');

interface FeedCardProps {
  title: string;
  description: string;
  thumbnail: any;
  priceText: string;
  onPress?: () => void;
}

const FeedCard: React.FC<FeedCardProps> = ({
  title,
  description,
  thumbnail,
  priceText,
  onPress,
}) => {

  const { isSubscribed } = useUser();

  const onPressHandle = (isPaid: boolean) => {
    const safeOnPress = onPress ?? (() => { });
    if (isPaid) {
      checkSubscriptionAndProceed(safeOnPress);
    } else {
      safeOnPress();
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPressHandle(priceText === 'Lock')}
      activeOpacity={0.9}
    >
      {/* Text Content */}
      <View style={styles.textContent}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      {/* Video Thumbnail */}
      <View style={styles.thumbnailContainer}>
        <Image source={thumbnail} style={styles.thumbnail} resizeMode="cover" />
        
        {/* Play Button Overlay */}
        <View style={styles.playButtonContainer}>
          <View style={styles.playButton}>
            <Icon name="play" size={20} color="#000000" />
          </View>
        </View>

        {/* Price Badge */}
        <View style={styles.priceBadge}>
          {priceText === 'Lock' ? (
            <>
              {!isSubscribed && <LockIcon width={16} height={16} fill="none" stroke="#B62020" strokeWidth="2" />}
              <Text style={styles.priceText}>{isSubscribed ? 'Unlocked' : priceText}</Text>
            </>
          ) : (
            <Text style={styles.priceText}>{priceText}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  textContent: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    color: '#000000',
    marginBottom: 12,
    fontFamily: getFontFamily('heading'),
    lineHeight: 28,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    fontFamily: getFontFamily('body'),
  },
  thumbnailContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    height: 200, // Fixed height for consistent card sizing
    width: width + 34, // Extend beyond both left and right padding
    marginLeft: -16,
    marginRight: -18,
    marginBottom: -16,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    resizeMode: 'cover',
  },
  playButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  priceBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#B62020',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: getFontFamily('bold'),
  },
  lockIcon: {
    marginRight: 4,
  },
});

export default FeedCard;
