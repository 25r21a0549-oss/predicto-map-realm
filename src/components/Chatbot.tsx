import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
}

const FAQ_RESPONSES: Record<string, string> = {
  'price': 'To get a price prediction, select a location on the map, choose your land type, enter the area in sqft, and specify how many years into the future you want to predict.',
  'predict': 'To get a price prediction, select a location on the map, choose your land type, enter the area in sqft, and specify how many years into the future you want to predict.',
  'how': 'Our prediction system uses location data, land type, and market trends to estimate current and future land prices. Results are shown as a range for accuracy.',
  'land type': 'We support 5 land types: Commercial, Residential, Industrial, Agricultural, and Mixed Use. Each has different pricing factors.',
  'roi': 'The ROI calculator helps you understand potential returns on your land investment. Visit the ROI page after saving your predictions.',
  'compare': 'Use the Compare page to compare two saved areas side-by-side, including predicted prices, amenities scores, and development metrics.',
  'tax': 'The Tax Calculator helps estimate stamp duty, property tax, registration fees, and total costs based on property price and usage type.',
  'save': 'You can save areas and predictions by clicking the save buttons. Saved data appears in your Dashboard and Account pages.',
  'account': 'Your Account page shows your profile, saved areas, preferences, and activity history.',
  'help': 'I can help with: price predictions, land types, ROI calculations, area comparisons, tax calculations, and account features. Just ask!',
  'hello': 'Hello! Welcome to the Land Price Predictor. How can I help you today?',
  'hi': 'Hi there! I\'m your assistant for land price predictions. What would you like to know?',
};

function getBotResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  for (const [keyword, response] of Object.entries(FAQ_RESPONSES)) {
    if (lowerMessage.includes(keyword)) {
      return response;
    }
  }
  
  return 'I can help you with price predictions, land types, ROI calculations, tax calculations, and more. Try asking about any of these topics, or type "help" for a list of what I can assist with.';
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      content: 'Hello! I\'m your Land Price Predictor assistant. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    const botResponse: Message = {
      id: (Date.now() + 1).toString(),
      role: 'bot',
      content: getBotResponse(input.trim())
    };

    setMessages(prev => [...prev, userMessage, botResponse]);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] flex flex-col shadow-xl z-50 border-primary/20">
          <CardHeader className="pb-3 border-b bg-primary text-primary-foreground rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5" />
              Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                  }`}>
                    {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {message.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t bg-background">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button onClick={handleSend} size="icon" disabled={!input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
