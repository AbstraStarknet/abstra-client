import { X } from 'lucide-react-native'
import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'

const { width, height } = Dimensions.get('window')

export type ChatMsg = { id: string; fromMe: boolean; text: string }

export function ChatModal(props: {
  visible: boolean
  onClose: () => void
  messages: ChatMsg[]
  onSend: (text: string) => void
}) {
  const { visible, onClose, messages, onSend } = props
  const [input, setInput] = useState('')
  const fadeAnim = useRef(new Animated.Value(0)).current
  const listRef = useRef<FlatList<ChatMsg>>(null)

  // Fade in/out
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [visible])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (visible && messages.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages, visible])

  const handleSend = () => {
    if (!input.trim()) return
    onSend(input.trim())
    setInput('')
  }

  if (!visible) return null

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AI Chat</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <X color="#fff" size={20} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.body}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.fromMe ? styles.bubbleMe : styles.bubbleBot,
              ]}
            >
              <Text style={styles.bubbleText}>{item.text}</Text>
            </View>
          )}
        />

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: 'padding' })}
          keyboardVerticalOffset={Platform.select({ ios: 90, android: 0 })}
        >
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Type here..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={input}
              onChangeText={setInput}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <Text style={styles.sendTxt}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0,
    width, height,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: '95%',
    height: '85%',
    backgroundColor: '#121b2f',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  body: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bubble: {
    marginVertical: 4,
    padding: 10,
    borderRadius: 12,
    maxWidth: '75%',
  },
  bubbleMe: {
    backgroundColor: '#5e72e4',
    alignSelf: 'flex-end',
  },
  bubbleBot: {
    backgroundColor: '#333',
    alignSelf: 'flex-start',
  },
  bubbleText: { color: '#fff', fontSize: 14 },
  inputRow: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  input: {
    flex: 1,
    color: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  sendBtn: {
    marginLeft: 8,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#5e72e4',
    borderRadius: 8,
  },
  sendTxt: { color: '#fff', fontWeight: '600' },
})