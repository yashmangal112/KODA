import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  StatusBar,
  Image,
  Easing,
} from 'react-native';

import { colors, typography } from '@/constants/theme';

import { useRouter } from 'expo-router';

import { KodaWordmark } from '@/components/KodaWordmark';
import ListeningGlowBackground from '@/components/CinematicBackground';
import { setOnboarding5aDone } from '@/services/storage';


const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Every word. Every action.',
    subtitle: 'Your meetings, finally useful.',
    image: require('@/assets/images/onboarding-1.png'),
  },

  {
    id: '2',
    title: 'AI-powered Insights.',
    subtitle: 'Summaries generated instantly.',
    image: require('@/assets/images/onboarding-2.png'),
  },

  {
    id: '3',
    title: 'Seamless Sync.',
    subtitle: 'Push tasks directly to Jira & Slack.',
    image: require('@/assets/images/onboarding-3.png'),
  },
];

const BANNER_WIDTH = width * 0.84;
const BANNER_HEIGHT = 300;

function Slide({ item, isActive }: any) {
  const floatAnim = useRef(
    new Animated.Value(0),
  ).current;

  const fadeAnim = useRef(
    new Animated.Value(0),
  ).current;

  const slideAnim = useRef(
    new Animated.Value(20),
  ).current;

  useEffect(() => {
    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -20,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    floating.start();

    return () => floating.stop();
  }, []);

  useEffect(() => {
    if (isActive) {
      fadeAnim.setValue(0);
      slideAnim.setValue(20);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.bezier(
            0.16,
            1,
            0.3,
            1,
          ),
          useNativeDriver: true,
        }),

        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.bezier(
            0.16,
            1,
            0.3,
            1,
          ),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActive]);

  return (
    <View style={styles.slide}>
      {/* HERO IMAGE */}
      <Animated.View
        style={[
          styles.bannerCard,

          {
            opacity: fadeAnim,

            transform: [
              {
                translateY: Animated.add(
                  floatAnim,
                  slideAnim,
                ),
              },
            ],
          },
        ]}
      >
        <Image
          source={item.image}
          style={styles.bannerImage}
          resizeMode="cover"
        />
      </Animated.View>

      {/* TEXT */}
      <Animated.View
        style={[
          styles.textContainer,

          {
            opacity: fadeAnim,

            transform: [
              {
                translateY: slideAnim,
              },
            ],
          },
        ]}
      >
        <Text style={styles.title}>
          {item.title}
        </Text>

        <Text style={styles.subtitle}>
          {item.subtitle}
        </Text>
      </Animated.View>
    </View>
  );
}

export default function Onboarding5AScreen() {
  const router = useRouter();

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const scrollRef =
    useRef<Animated.ScrollView>(null);

  // AUTO CAROUSEL
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex =
        (currentIndex + 1) % SLIDES.length;

      scrollRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });

      setCurrentIndex(nextIndex);
    }, 6500);

    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* BACKGROUND */}
      <ListeningGlowBackground />

      {/* HEADER */}
      <View style={styles.header}>
        <KodaWordmark kodColor={colors.onSurface} />
      </View>

      {/* CAROUSEL */}
      <View style={styles.carouselWrapper}>
        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={width}
          snapToAlignment="center"
          onMomentumScrollEnd={(event) => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x /
                width,
            );

            setCurrentIndex(index);
          }}
        >
          {SLIDES.map((item, index) => (
            <Slide
              key={item.id}
              item={item}
              isActive={
                currentIndex === index
              }
            />
          ))}
        </Animated.ScrollView>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        {/* DOTS */}
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,

                currentIndex === index
                  ? styles.activeDot
                  : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.9}
          onPress={async () => {
            await setOnboarding5aDone();
            router.push('/(auth)/register');
          }}
        >
          <Text style={styles.buttonText}>
            Get started
          </Text>

          <Text style={styles.arrow}>
            →
          </Text>
        </TouchableOpacity>

        {/* LOGIN */}
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>
            Already have an account?
          </Text>

          <TouchableOpacity
            onPress={() =>
              router.push(
                '/(auth)/login',
              )
            }
          >
            <Text style={styles.loginLink}>
              {' '}
              Log in
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: '#0D0D0D',

    alignItems: 'center',

    overflow: 'hidden',
  },

  header: {
    width: '100%',

    alignItems: 'center',

    paddingTop: 50,

    zIndex: 10,

    paddingBottom: 20,
  },

  carouselWrapper: {
    flex: 1,
    width,
  },

  slide: {
    width,
    marginTop: 20,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 24,
  },

  bannerCard: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,

    borderRadius: 28,

    overflow: 'hidden',

    backgroundColor:
      'rgba(255,255,255,0.03)',

    borderWidth: 1,

    borderColor:
      'rgba(255,255,255,0.06)',

    marginBottom: 20,
  },

  bannerImage: {
    width: '100%',
    height: '100%',
  },

  textContainer: {
    alignItems: 'center',
  },

  title: {
    color: '#FFFFFF',

    fontSize: 28,

    lineHeight: 34,

    textAlign: 'center',

    letterSpacing: -1,

    fontFamily:
      typography.fontFamily.bold,
  },

  subtitle: {
    marginTop: 10,

    color: 'rgba(227,190,182,0.75)',

    fontSize: 15,

    lineHeight: 24,

    textAlign: 'center',

    maxWidth: 260,

    fontFamily:
      typography.fontFamily.medium,
  },

  footer: {
    width: '100%',

    paddingHorizontal: 24,

    paddingBottom: 36,

    alignItems: 'center',
  },

  pagination: {
    flexDirection: 'row',

    marginBottom: 28,
  },

  dot: {
    height: 6,

    borderRadius: 99,

    marginHorizontal: 4,
  },

  activeDot: {
    width: 28,

    backgroundColor: colors.brandOrange,
  },

  inactiveDot: {
    width: 6,

    backgroundColor:
      'rgba(255,255,255,0.18)',
  },

  button: {
    width: '100%',

    height: 58,

    borderRadius: 18,

    backgroundColor: colors.brandOrange,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    shadowColor: colors.brandOrange,

    shadowOpacity: 0.35,

    shadowRadius: 24,

    shadowOffset: {
      width: 0,
      height: 0,
    },

    elevation: 10,
  },

  buttonText: {
    color: colors.orangeDark,
    fontSize: 17,
    fontFamily: typography.fontFamily.bold,
  },

  arrow: {
    marginLeft: 8,

    color: colors.orangeDark,

    fontSize: 18,

    fontWeight: '700',
  },

  loginRow: {
    flexDirection: 'row',

    marginTop: 22,
  },

  loginText: {
    color:
      'rgba(227,190,182,0.45)',

    fontSize: 13,

    fontFamily:
      typography.fontFamily.regular,
  },

  loginLink: {
    color: colors.brandOrange,

    fontSize: 13,

    fontFamily:
      typography.fontFamily.bold,
  },
});