/**
 * MeetingOptionsMenu
 *
 * Triggered by the ··· button in the meeting detail top bar.
 *
 * Three actions:
 *   1. Update  — slide-up sheet with title + summary inputs → PATCH API
 *   2. Archive — warning confirmation modal → PATCH status='archived'
 *   3. Share   — TODO: implement public link / export later
 *
 * TODO: Wire updateMeeting() and archiveMeeting() to your real API calls.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import WarningModal from '@/helper/WarningModal';

import { colors, typography } from '@/constants/theme';
import { useToast } from '@/contexts/ToastContext';

// ── Design tokens ─────────────────────────────────────────────────────────

const ORANGE  = colors.brandOrange;
const TEAL    = colors.teal;
const ERROR   = '#ffb4ab';
const BG      = '#0d0d0d';
const SURFACE = colors.surface;
const SURFACE_HIGH = colors.surfaceHigh;
const ON_SURFACE   = colors.onSurface;
const ON_VAR       = 'rgba(227,190,182,0.6)';
const BORDER       = colors.border;

// ── Types ─────────────────────────────────────────────────────────────────

type MenuOption = {
  id:    'update' | 'archive' | 'share';
  label: string;
  icon:  React.ComponentProps<typeof MaterialIcons>['name'];
  color: string;
  sublabel?: string;
};

const OPTIONS: MenuOption[] = [
  {
    id:       'update',
    label:    'Edit meeting',
    sublabel: 'Update title or summary',
    icon:     'edit',
    color:    ON_SURFACE,
  },
  {
    id:       'share',
    label:    'Export',
    sublabel: 'Coming soon',
    icon:     'ios-share',
    color:    ON_VAR,
  },
  {
    id:       'archive',
    label:    'Archive',
    sublabel: 'Hide from meetings list',
    icon:     'archive',
    color:    ERROR,
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Reusable animated scrim
// ─────────────────────────────────────────────────────────────────────────

function Scrim({ opacity, onPress }: { opacity: Animated.Value; onPress: () => void }) {
  return (
    <Animated.View style={[styles.scrim, { opacity }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onPress} />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Floating action menu  (slides down from top-right, near the ··· button)
// ─────────────────────────────────────────────────────────────────────────

type ActionMenuProps = {
  visible:   boolean;
  onClose:   () => void;
  onSelect:  (id: MenuOption['id']) => void;
};

function ActionMenu({ visible, onClose, onSelect }: ActionMenuProps) {
  const scaleAnim   = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scrimAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim,   { toValue: 1, bounciness: 5, speed: 18, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.timing(scrimAnim,   { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim,   { toValue: 0, duration: 150, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scrimAnim,   { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Scrim opacity={scrimAnim} onPress={onClose} />

      {/* Menu card — anchored top-right, origin top-right for scale */}
      <Animated.View
        style={[
          styles.menuCard,
          {
            opacity: opacityAnim,
            transform: [
              { translateX: 0 },
              { scale: scaleAnim },
            ],
            transformOrigin: 'top right',
          },
        ]}
      >
        {OPTIONS.map((opt, i) => {
          const isDisabled = opt.id === 'share';
          return (
            <React.Fragment key={opt.id}>
              {i > 0 && <View style={styles.menuDivider} />}
              <TouchableOpacity
                onPress={() => {
                  if (isDisabled) return;
                  onClose();
                  // Small delay so menu closes before next modal opens
                  setTimeout(() => onSelect(opt.id), 180);
                }}
                activeOpacity={isDisabled ? 1 : 0.7}
                style={[styles.menuItem, isDisabled && styles.menuItemDisabled]}
              >
                <View style={[styles.menuIconBox, { backgroundColor: `${opt.color}14` }]}>
                  <MaterialIcons name={opt.icon} size={18} color={opt.color} />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={[styles.menuLabel, { color: opt.color }]}>{opt.label}</Text>
                  {opt.sublabel && (
                    <Text style={styles.menuSublabel}>{opt.sublabel}</Text>
                  )}
                </View>
                {isDisabled && (
                  <View style={styles.soonBadge}>
                    <Text style={styles.soonText}>SOON</Text>
                  </View>
                )}
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </Animated.View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Update Sheet  (slide up, title + summary inputs)
// ─────────────────────────────────────────────────────────────────────────

type UpdateSheetProps = {
  visible:     boolean;
  onClose:     () => void;
  initialTitle:   string;
  initialSummary: string;
  onSave:      (title: string, summary: string) => Promise<void>;
};

function UpdateSheet({
  visible,
  onClose,
  initialTitle,
  initialSummary,
  onSave,
}: UpdateSheetProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrimAnim = useRef(new Animated.Value(0)).current;

  const [title,   setTitle]   = useState(initialTitle);
  const [summary, setSummary] = useState(initialSummary);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const toast = useToast();

  // Reset fields when opened
  useEffect(() => {
    if (visible) {
      setTitle(initialTitle);
      setSummary(initialSummary);
      setError(null);
    }
  }, [visible, initialTitle, initialSummary]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 1, bounciness: 3, speed: 16, useNativeDriver: true }),
        Animated.timing(scrimAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 260, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        Animated.timing(scrimAnim, { toValue: 0, duration: 240, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [500, 0],
  });

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title cannot be empty.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(title.trim(), summary.trim());
      toast.showSuccess('Meeting updated'); 
      onClose();
    } catch (e) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Scrim opacity={scrimAnim} onPress={onClose} />

      <KeyboardAvoidingView
        style={styles.sheetOuter}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Edit meeting</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="close" size={20} color={ON_VAR} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.sheetBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>TITLE</Text>
              <TextInput
                style={styles.fieldInput}
                value={title}
                onChangeText={(t) => { setTitle(t); setError(null); }}
                placeholder="Meeting title"
                placeholderTextColor={ON_VAR}
                selectionColor={ORANGE}
                returnKeyType="next"
                maxLength={120}
              />
              <Text style={styles.fieldCounter}>{title.length}/120</Text>
            </View>

            {/* Summary field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>SUMMARY</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputMulti]}
                value={summary}
                onChangeText={setSummary}
                placeholder="Brief summary of this meeting"
                placeholderTextColor={ON_VAR}
                selectionColor={ORANGE}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.fieldCounter}>{summary.length}/500</Text>
            </View>

            {/* Error */}
            {error && (
              <View style={styles.errorBanner}>
                <MaterialIcons name="error-outline" size={15} color={ERROR} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Save button */}
            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={saving}
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            >
              {saving ? (
                <SaveSpinner />
              ) : (
                <Text style={styles.saveBtnText}>Save changes</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Small spinning indicator for save state
function SaveSpinner() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <MaterialIcons name="refresh" size={20} color="#5c0c00" />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Archive Confirmation Modal
// ─────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────
// Main exported component
// ─────────────────────────────────────────────────────────────────────────

export type MeetingOptionsMenuProps = {
  /** Whether the action menu is visible */
  menuVisible:    boolean;
  onMenuClose:    () => void;
  /** Current meeting data for pre-filling the edit form */
  meetingTitle:   string;
  meetingSummary: string;
  /** Called with updated values — make your PATCH call inside this */
  onUpdate: (title: string, summary: string) => Promise<void>;
  /** Called when archive is confirmed — make your PATCH/archive call inside */
  onArchive: () => Promise<void>;
};

export default function MeetingOptionsMenu({
  menuVisible,
  onMenuClose,
  meetingTitle,
  meetingSummary,
  onUpdate,
  onArchive,
}: MeetingOptionsMenuProps) {
  const [updateVisible,  setUpdateVisible]  = useState(false);
  const [archiveVisible, setArchiveVisible] = useState(false);  

  const handleSelect = useCallback((id: MenuOption['id']) => {
    if (id === 'update')  setUpdateVisible(true);
    if (id === 'archive') setArchiveVisible(true);
    // id === 'share' → TODO
  }, []);

  return (
    <>
      <ActionMenu
        visible={menuVisible}
        onClose={onMenuClose}
        onSelect={handleSelect}
      />

      <UpdateSheet
        visible={updateVisible}
        onClose={() => setUpdateVisible(false)}
        initialTitle={meetingTitle}
        initialSummary={meetingSummary}
        onSave={onUpdate}
      />

      <WarningModal
        visible={archiveVisible}
        onClose={() => setArchiveVisible(false)}
        onConfirm={onArchive}
        icon="archive"
        title="Archive meeting?"
        body={`${meetingTitle} will be hidden from your meetings list.`}
        highlight={meetingTitle}
        confirmLabel="Archive"
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 10,
  },

  // ── Action menu ──────────────────────────────────────────────────────

  menuCard: {
    position: 'absolute',
    top: 68,           // just below the top bar
    right: 16,
    width: 230,
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  menuItemDisabled: {
    opacity: 0.45,
  },
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    flex: 1,
    gap: 2,
  },
  menuLabel: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    letterSpacing: 0.1,
  },
  menuSublabel: {
    fontSize: 11,
    color: ON_VAR,
    fontFamily: typography.fontFamily.regular,
  },
  menuDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginHorizontal: 14,
  },
  soonBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: `${ON_VAR}22`,
  },
  soonText: {
    fontSize: 9,
    fontFamily: typography.fontFamily.bold,
    color: ON_VAR,
    letterSpacing: 1,
  },

  // ── Update sheet ─────────────────────────────────────────────────────

  sheetOuter: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 20,
  },
  sheet: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: BORDER,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: typography.fontFamily.bold,
    color: ON_SURFACE,
    letterSpacing: -0.2,
  },
  sheetBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 20,
  },

  // Fields
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.semiBold,
    color: ON_VAR,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  fieldInput: {
    backgroundColor: SURFACE_HIGH,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: ON_SURFACE,
    fontFamily: typography.fontFamily.regular
  },
  fieldInputMulti: {
    height: 110,
    paddingTop: 12,
  },
  fieldCounter: {
    fontSize: 11,
    color: ON_VAR,
    textAlign: 'right',
    fontFamily: typography.fontFamily.regular,
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${ERROR}14`,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: `${ERROR}30`,
  },
  errorText: {
    fontSize: 13,
    color: ERROR,
    fontFamily: typography.fontFamily.regular,
    flex: 1,
  },

  // Save button
  saveBtn: {
    height: 52,
    backgroundColor: ORANGE,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
    marginTop: 4,
  },
  saveBtnDisabled: {
    opacity: 0.65,
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    color: '#5c0c00',
    letterSpacing: 0.2,
  },

  // ── Archive modal ────────────────────────────────────────────────────

  archiveCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 20,
  },
  archiveCard: {
    width: '100%',
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 18,
  },
  archiveIconRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${ERROR}14`,
    borderWidth: 1,
    borderColor: `${ERROR}30`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  archiveTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    color: ON_SURFACE,
    letterSpacing: -0.2,
  },
  archiveBody: {
    fontSize: 14,
    color: ON_VAR,
    textAlign: 'center',
    lineHeight: 21,
    fontFamily: typography.fontFamily.regular,
  },
  archiveBodyBold: {
    color: ON_SURFACE,
    fontFamily: typography.fontFamily.semiBold,
  },
  archiveActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    width: '100%',
  },
  archiveCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: SURFACE_HIGH,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveCancelText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.semiBold,
    color: ON_SURFACE,
  },
  archiveConfirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: `${ERROR}18`,
    borderWidth: 1,
    borderColor: `${ERROR}40`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveConfirmText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    color: ERROR,
  },
});