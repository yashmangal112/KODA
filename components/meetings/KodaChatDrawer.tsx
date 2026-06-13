/**
 * KodaChatDrawer
 *
 * A bottom drawer that lives beneath the "Ask KODA" pill on the meeting detail screen.
 * 
 * UX behaviour:
 *   - A drag handle sits below the pill → tap or swipe up to open
 *   - Drawer snaps to two heights: PEEK (50%) and EXPANDED (88%)
 *   - Sending a message via the pill auto-opens to PEEK if closed
 *   - Typing in the drawer input keeps focus + scrolls to latest message
 *   - Messages are grouped: user question (right) / KODA answer (left)
 *   - Empty state shows suggested prompts
 *
 * TODO: Replace mock responses with real streaming API call to your FastAPI
 *       /api/v1/meetings/:id/ask endpoint.
 */

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography } from '@/constants/theme';

import {askMeeting} from '@/services/meetings';
import { getApiErrorMessage, isNetworkError } from "@/lib/apiErrors";
import { useToast } from '@/contexts/ToastContext';
// ── Constants ─────────────────────────────────────────────────────────────

const { height: SCREEN_H } = Dimensions.get('window');

const PEEK_H     = SCREEN_H * 0.50;   // 50% — default open
const EXPANDED_H = SCREEN_H * 0.88;   // 88% — fully expanded
const CLOSED_H   = 0;

const ORANGE        = colors.brandOrange;
const TEAL          = colors.teal;
const BG            = '#131313';
const SURFACE       = colors.surface;
const SURFACE_HIGH  = colors.surfaceHigh;
const ON_SURFACE    = colors.onSurface;
const ON_VAR        = 'rgba(227,190,182,0.6)';
const BORDER        = 'rgba(255,255,255,0.07)';
const PRIMARY       = '#ffb4a4';

// ── Types ─────────────────────────────────────────────────────────────────

export type ChatMessage = {
  id: string;
  role: 'user' | 'koda';
  text: string;
  timestamp: string;
};

// ── Suggested prompts shown when history is empty ─────────────────────────

const SUGGESTED_PROMPTS = [
  'Summarise this meeting',
  'List all action items',
  'Who owns what task?',
  'What decisions were made?',
];

// ── Ref handle so parent can call open() / sendMessage() externally ───────

export type KodaChatDrawerHandle = {
  open: () => void;
  close: () => void;
  sendMessage: (text: string) => void;
};

// ── Timestamp helper ──────────────────────────────────────────────────────

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Single chat bubble ────────────────────────────────────────────────────

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowKoda]}>
      {/* KODA avatar dot */}
      {!isUser && (
        <View style={styles.kodaAvatar}>
          <Text style={styles.kodaAvatarText}>K</Text>
        </View>
      )}

      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleKoda]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {message.text}
        </Text>
        <Text style={[styles.bubbleTime, isUser && styles.bubbleTimeUser]}>
          {message.timestamp}
        </Text>
      </View>
    </View>
  );
}

// ── Typing indicator (three pulsing dots) ────────────────────────────────

function TypingIndicator() {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.delay((2 - i) * 160),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.typingRow}>
      <View style={styles.kodaAvatar}>
        <Text style={styles.kodaAvatarText}>K</Text>
      </View>
      <View style={styles.typingBubble}>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.typingDot,
              {
                opacity: dot,
                transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────

const KodaChatDrawer = forwardRef<KodaChatDrawerHandle, {meetingId?: string; }>(({ meetingId }, ref) => {

  const [drawerState, setDrawerState]   = useState<'closed' | 'peek' | 'expanded'>('closed');
  const [messages, setMessages]         = useState<ChatMessage[]>([]);
  const [inputText, setInputText]       = useState('');
  const [isTyping, setIsTyping]         = useState(false);

  const toast = useToast();

  const heightAnim  = useRef(new Animated.Value(CLOSED_H)).current;
  const scrollRef   = useRef<ScrollView>(null);
  const inputRef    = useRef<TextInput>(null);

  // ── Animate to a target height ───────────────────────────────────────

  const animateTo = useCallback((targetH: number, onDone?: () => void) => {
    Animated.spring(heightAnim, {
      toValue: targetH,
      bounciness: 3,
      speed: 16,
      useNativeDriver: false,
    }).start(onDone);
  }, []);

  const open = useCallback(() => {
    setDrawerState('peek');
    animateTo(PEEK_H);
  }, [animateTo]);

  const expand = useCallback(() => {
    setDrawerState('expanded');
    animateTo(EXPANDED_H);
  }, [animateTo]);

  const close = useCallback(() => {
    Keyboard.dismiss();
    setDrawerState('closed');
    animateTo(CLOSED_H);
  }, [animateTo]);

  // ── Expose handle to parent ──────────────────────────────────────────

  useImperativeHandle(ref, () => ({
    open,
    close,
    sendMessage: (text: string) => {
      handleSend(text);
    },
  }));

  // ── Pan responder for drag gesture ───────────────────────────────────

  const dragStartY    = useRef(0);
  const dragStartH    = useRef(CLOSED_H);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  (_, g) => Math.abs(g.dy) > 6,

      onPanResponderGrant: (_, g) => {
        dragStartY.current = g.y0;
        // Read current animated height
        // @ts-ignore — _value is internal but reliable
        dragStartH.current = heightAnim._value;
      },

      onPanResponderMove: (_, g) => {
        const newH = Math.max(0, Math.min(EXPANDED_H, dragStartH.current - g.dy));
        heightAnim.setValue(newH);
      },

      onPanResponderRelease: (_, g) => {
        // @ts-ignore
        const currentH = heightAnim._value;
        const velocity = -g.vy;   // negative because dragging up = negative vy

        if (velocity > 0.5 || currentH > PEEK_H + 60) {
          // Fast swipe up or dragged above midpoint → expand
          expand();
        } else if (velocity < -0.5 || currentH < PEEK_H - 80) {
          // Fast swipe down or dragged below midpoint → close
          close();
        } else {
          // Snap to peek
          open();
        }
      },
    })
  ).current;

  // ── Send message ─────────────────────────────────────────────────────


 const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? inputText).trim();
    if (!text) return;

    // Auto-open if closed
    setDrawerState((prev) => {
      if (prev === 'closed') {
        animateTo(PEEK_H);
        return 'peek';
      }
      return prev;
    });

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: nowTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Scroll to bottom after state update
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

    try {
        const data = await askMeeting(meetingId, { question: text });

        setIsTyping(false);
        const kodaMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'koda',
            text: data.answer,
            timestamp: nowTime(),
        };
        setMessages((prev) => [...prev, kodaMsg]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

    } catch (error) {
        setIsTyping(false);
        if(isNetworkError(error)) return;
        const msg = getApiErrorMessage(error, 'Something went wrong. Please try again.');
        toast.showError(msg);
    }
    }, [inputText, animateTo, meetingId, toast]);

  // ── Keyboard handling — expand drawer when keyboard opens ────────────

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => {
      if (drawerState !== 'closed') expand();
    });
    return () => show.remove();
  }, [drawerState, expand]);

  // ── Empty state ───────────────────────────────────────────────────────

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="auto-awesome" size={28} color={`${ORANGE}60`} />
      <Text style={styles.emptyTitle}>Ask KODA anything</Text>
      <Text style={styles.emptySubtitle}>About this meeting</Text>

      <View style={styles.suggestions}>
        {SUGGESTED_PROMPTS.map((p) => (
          <TouchableOpacity
            key={p}
            style={styles.suggestion}
            activeOpacity={0.75}
            onPress={() => handleSend(p)}
          >
            <Text style={styles.suggestionText}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // ── Render ─────────────────────────────────────────────────────────────

  const isOpen = drawerState !== 'closed';

  return (
    <>
      {/* ── Scrim — tap outside to close ── */}
      {isOpen && (
        <Pressable
          style={styles.scrim}
          onPress={close}
        />
      )}

      {/* ── Drag handle + drawer wrapper ── */}
      <View style={styles.drawerAnchor}>

        {/* Drag handle — always visible below the pill */}
        {drawerState === 'closed' && (
          <View {...panResponder.panHandlers} style={styles.handleZone}>
            <View style={styles.handleBar} />
          </View>
        )} 

        {/* Drawer panel */}
        <Animated.View style={[styles.drawer, { height: heightAnim }]}>

          {/* Inner drag zone (handle inside open drawer) */}
          <View {...panResponder.panHandlers} style={styles.innerHandle}>
            <View style={styles.handleBar} />
          </View>

          {/* Header */}
          <View style={styles.drawerHeader}>
            <View style={styles.drawerHeaderLeft}>
              <MaterialIcons name="auto-awesome" size={16} color={ORANGE} />
              <Text style={styles.drawerHeaderTitle}>KODA Intelligence</Text>
            </View>
            <TouchableOpacity onPress={close} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="keyboard-arrow-down" size={22} color={PRIMARY} />
            </TouchableOpacity>
          </View>

          {/* Chat area */}
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
          >
            <ScrollView
              ref={scrollRef}
              style={styles.chatScroll}
              contentContainerStyle={styles.chatContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.length === 0 && !isTyping
                ? <EmptyState />
                : messages.map((m) => <ChatBubble key={m.id} message={m} />)
              }
              {isTyping && <TypingIndicator />}
            </ScrollView>

            {/* Input row */}
            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Ask about this meeting..."
                placeholderTextColor={ON_VAR}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSend()}
                returnKeyType="send"
                multiline={false}
                onFocus={expand}
              />
              <TouchableOpacity
                onPress={() => handleSend()}
                activeOpacity={0.8}
                style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                disabled={!inputText.trim()}
              >
                <MaterialIcons name="send" size={18} color={inputText.trim() ? '#5c0c00' : ON_VAR} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </>
  );
});

export default KodaChatDrawer;


// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  /* Scrim */
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    // backgroundColor: '#1c1b1b',
    zIndex: 30,
  },

  /* Anchor — sits at the bottom of the screen below the pill */
  drawerAnchor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    alignItems: 'center',
  },

  /* Handle zone — visible even when drawer is closed */
  handleZone: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  /* Drawer panel */
  drawer: {
    width: '100%',
    backgroundColor: SURFACE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: BORDER,
    overflow: 'hidden',
  },

  /* Inner handle (inside the open drawer) */
  innerHandle: {
    paddingTop: 12,
    paddingBottom: 4,
    alignItems: 'center',
  },

  /* Header */
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  drawerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drawerHeaderTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    color: ON_SURFACE,
    letterSpacing: 0.2,
  },

  /* Chat scroll */
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 16,
    flexGrow: 1,
  },

  /* Bubbles */
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  bubbleRowKoda: {
    justifyContent: 'flex-start',
  },
  kodaAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: `${ORANGE}22`,
    borderWidth: 1,
    borderColor: `${ORANGE}40`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  kodaAvatarText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: ORANGE,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  bubbleUser: {
    backgroundColor: ORANGE,
    borderBottomRightRadius: 4,
  },
  bubbleKoda: {
    backgroundColor: SURFACE_HIGH,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  bubbleText: {
    fontSize: 14,
    color: ON_SURFACE,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular
  },
  bubbleTextUser: {
    color: '#fff',
    fontFamily: typography.fontFamily.regular
  },
  bubbleTime: {
    fontSize: 10,
    color: ON_VAR,
    alignSelf: 'flex-end',
    fontFamily: typography.fontFamily.regular
  },
  bubbleTimeUser: {
    color: 'rgba(255,255,255,0.55)',
    fontFamily: typography.fontFamily.regular
  },

  /* Typing indicator */
  typingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: SURFACE_HIGH,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ON_VAR,
  },

  /* Empty state */
  emptyState: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.semiBold,
    color: ON_SURFACE,
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: ON_VAR,
    marginBottom: 8,
    fontFamily: typography.fontFamily.regular
  },
  suggestions: {
    width: '100%',
    gap: 8,
    marginTop: 4,
  },
  suggestion: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: `${ORANGE}0f`,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${ORANGE}25`,
  },
  suggestionText: {
    fontSize: 13,
    color: ON_SURFACE,
    fontFamily: typography.fontFamily.medium,
  },

  /* Input row */
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: SURFACE,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: SURFACE_HIGH,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    color: ON_SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    fontFamily: typography.fontFamily.regular,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: SURFACE_HIGH,
    shadowOpacity: 0,
    elevation: 0,
  },
});