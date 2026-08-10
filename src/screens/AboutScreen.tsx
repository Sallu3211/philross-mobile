import React, { useState, useEffect } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DeviceInfo from 'react-native-device-info';
import { theme } from '../theme';
import ScreenHeader from '../components/ui/ScreenHeader';
import { EmptyState, LoadingState } from '../components/ui/StateView';
import { Info } from '../components/ui/icons';

const AboutScreen = ({ navigation }: any) => {
  const [aboutData, setAboutData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appVersion, setAppVersion] = useState<string>('');
  const [buildNumber, setBuildNumber] = useState<string>('');

  // Fetch About Us data from API and app version info
  useEffect(() => {
    fetchAboutData();
    fetchVersionInfo();
  }, []);

  const fetchAboutData = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('https://api.philross.com/sitecontent/about-us');
      const data = await response.json();
      
      if (data.status && data.data) {
        setAboutData(data.data);
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVersionInfo = async () => {
    try {
      const version = DeviceInfo.getVersion();
      const build = DeviceInfo.getBuildNumber();
      setAppVersion(version);
      setBuildNumber(build);
    } catch (error) {
      // Handle error silently
    }
  };

  /** The API returns prose that may carry basic HTML; strip tags for display. */
  const plain = (html: unknown): string =>
    String(html ?? '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&#39;|&rsquo;/g, '’')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

  const body = plain(aboutData?.content);

  /**
   * The heading needs stripping too. It comes back wrapped by the CMS editor —
   * `<h2 style="margin-left:0px;">Master Phil: …</h2>` — so rendering it raw
   * printed the tag and its inline style across the top of the page.
   */
  const heading = plain(aboutData?.heading);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.color.surface.app} />

      <ScreenHeader title="About Phil" onBack={() => navigation.goBack()} />

      {isLoading ? (
        <LoadingState label="Loading" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {!!aboutData?.thumbnail_url && (
            <Image
              source={{ uri: aboutData.thumbnail_url }}
              style={styles.hero}
              resizeMode="cover"
            />
          )}

          <Text style={styles.heading}>{heading || 'Master Phil Ross'}</Text>

          {body ? (
            <Text style={styles.body}>{body}</Text>
          ) : (
            <EmptyState
              icon={Info}
              title="Nothing here yet"
              body="Phil's story will appear here soon."
            />
          )}

          <View style={styles.footer}>
            <Text style={styles.version}>
              {appVersion
                ? `Version ${appVersion}${buildNumber ? ` (${buildNumber})` : ''}`
                : ''}
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface.app },
  content: {
    paddingHorizontal: theme.space.screen,
    paddingBottom: theme.space['5xl'],
  },
  hero: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    backgroundColor: theme.color.neutral[200],
    marginBottom: theme.space.xl,
  },
  heading: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.display.fontSize,
    lineHeight: theme.type.display.lineHeight,
    letterSpacing: theme.type.display.letterSpacing,
    color: theme.color.text.primary,
    marginBottom: theme.space.lg,
  },
  body: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.body.fontSize,
    // Looser than the app default: this is the one screen of long-form reading.
    lineHeight: 24,
    color: theme.color.text.secondary,
  },
  footer: {
    marginTop: theme.space['4xl'],
    paddingTop: theme.space.xl,
    borderTopWidth: 1,
    borderTopColor: theme.color.border.subtle,
  },
  version: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.disabled,
    textAlign: 'center',
  },
});

export default AboutScreen;
