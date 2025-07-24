import { X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ChatModal({ visible, onClose }: ChatModalProps) {
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const modalAnim   = useRef(new Animated.Value(0)).current;
  const [text, setText] = useState('');
  const [msgs, setMsgs] = useState<{ id: string; fromMe: boolean; text: string }[]>([]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(modalAnim , { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    } else {
      // Fade out
      Animated.parallel([
        Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(modalAnim , { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const send = () => {
    if (!text.trim()) return;
    const me = { id: Date.now().toString(), fromMe: true, text: text.trim() };
    setMsgs(prev => [me, ...prev]);
    setText('');
    setTimeout(() => {
      const bot = {
        id: (Date.now()+1).toString(),
        fromMe: false,
        text: `🤖 Bot dice: “${me.text}”`,
      };
      setMsgs(prev => [bot, ...prev]);
    }, 700);
  };

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.overlay, { opacity: overlayAnim }]}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.modal,
          {
            transform: [{
              translateY: modalAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [height, height * 0.2]
              })
            }]
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Chat IA</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <X size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <View style={styles.messages}>
          {msgs.map(m => (
            <View
              key={m.id}
              style={[
                styles.bubble,
                m.fromMe ? styles.bubbleMe : styles.bubbleBot
              ]}
            >
              <Text style={styles.bubbleText}>{m.text}</Text>
            </View>
          ))}
        </View>

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputRow}
        >
          <TextInput
            style={styles.input}
            placeholder="Escribe aquí..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={text}
            onChangeText={setText}
          />
          <TouchableOpacity onPress={send} style={styles.sendBtn}>
            <Text style={styles.sendText}>Enviar</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modal: {
    position: 'absolute',
    left: width * 0.05,
    width: width * 0.9,
    height: height * 0.8,
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#9333ea',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  messages: { flex: 1, padding: 16 },
  bubble:   { marginVertical: 4, padding: 10, borderRadius: 12, maxWidth: '80%' },
  bubbleMe: { backgroundColor: '#9333ea', alignSelf: 'flex-end' },
  bubbleBot:{ backgroundColor: '#444',    alignSelf: 'flex-start' },
  bubbleText:{ color: '#fff', fontSize: 14 },

  inputRow: { flexDirection: 'row', padding: 12, backgroundColor: '#2a2a2a' },
  input:    { flex: 1, color: '#fff', backgroundColor: '#333', borderRadius: 8, padding: 10 },
  sendBtn:  { marginLeft: 8, justifyContent: 'center', paddingHorizontal: 16, backgroundColor: '#f97316', borderRadius: 8 },
  sendText: { color: '#fff', fontWeight: '700' },
});