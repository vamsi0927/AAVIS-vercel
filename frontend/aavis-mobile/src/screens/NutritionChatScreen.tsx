import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { ArrowLeft, Send } from 'lucide-react-native';
import { askAiChat } from '../lib/aiAnalysis';
import { getThemeColors } from '../lib/theme';
import { useAppContext } from '../context/AppContext';

type Message = {
  role: 'user' | 'model';
  text: string;
};

export default function NutritionChatScreen({ navigation }: any) {
  const { theme } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: "Hi! I'm Aavis AI. What nutrition questions, food ingredients, or health claims can I clarify for you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const colors = getThemeColors(theme);
  const styles = getStyles(colors);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const chatHistory = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const reply = await askAiChat(chatHistory, userMessage);
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageWrapper, isUser ? styles.userWrapper : styles.modelWrapper]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <Image source={require('../../assets/ai-assistant.jpg')} style={styles.botAvatarImage} />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.modelBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.modelMessageText]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.container}>
        {/* Glow */}
        {theme === 'dark' && <View style={styles.glowTop} />}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft color={colors.textPrimary} size={20} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>AI Nutritionist</Text>
            <View style={styles.activeIndicatorRow}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Online</Text>
            </View>
          </View>
        </View>

        {/* Chat List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={styles.chatListContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={() => (
            isTyping ? (
              <View style={styles.typingContainer}>
                <View style={styles.botAvatar}>
                  <Image source={require('../../assets/ai-assistant.jpg')} style={styles.botAvatarImage} />
                </View>
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color="#14b8a6" />
                </View>
              </View>
            ) : null
          )}
        />

        {/* Footer Input */}
        <View style={styles.footer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about ingredients, diets, myths..."
            placeholderTextColor={colors.textSecondary}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!input.trim() || isTyping}
          >
            <Send color="#ffffff" size={18} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingTop: 60,
  },
  glowTop: {
    position: 'absolute',
    top: -50,
    left: '25%',
    width: 250,
    height: 250,
    backgroundColor: '#14b8a6',
    borderRadius: 125,
    opacity: 0.04,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 10,
    backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginRight: 16,
  },
  headerTitleContainer: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  activeIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  activeText: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  chatListContent: {
    padding: 24,
    paddingBottom: 16,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    width: '100%',
  },
  userWrapper: {
    justifyContent: 'flex-end',
  },
  modelWrapper: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    alignSelf: 'flex-end',
    overflow: 'hidden',
  },
  botAvatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: '#14b8a6',
    borderBottomRightRadius: 4,
  },
  modelBubble: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#ffffff',
  },
  modelMessageText: {
    color: colors.textPrimary,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  typingBubble: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 16,
    color: colors.textPrimary,
    fontSize: 14,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#14b8a6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
