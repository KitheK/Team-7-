import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import { supabase } from '../../lib/supabase';

type Props = { onDemoPress?: () => void };

export default function LoginScreen({ onDemoPress }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPw, setShowPw] = useState(false);
  const c = useColors();
  const s = useMemo(() => createStyles(c), [c]);
  const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) { setError('Please enter both email and password.'); return; }
    if (!supabase) { setError('Supabase is not configured.'); return; }
    setLoading(true); setError(''); setMessage('');
    if (isSignUp) { const { error: e } = await supabase.auth.signUp({ email, password }); e ? setError(e.message) : setMessage('Check your email!'); }
    else { const { error: e } = await supabase.auth.signInWithPassword({ email, password }); if (e) setError(e.message); }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={s.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.container}>
        <View style={[s.card, isNative && s.cardNative]}>
          <View style={s.logoRow}>
            <View style={s.logoIcon}><Feather name="layers" size={24} color={c.primary} /></View>
          </View>
          <Text style={s.brand}>Alfred</Text>
          <Text style={s.subtitle}>{isSignUp ? 'Create your account' : 'Business finances, simplified'}</Text>

          {error !== '' && <View style={s.errorBox}><Feather name="alert-circle" size={16} color={c.danger} /><Text style={s.errorText}>{error}</Text></View>}
          {message !== '' && <View style={s.successBox}><Feather name="check-circle" size={16} color={c.success} /><Text style={s.successText}>{message}</Text></View>}

          <Text style={s.label}>Email</Text>
          <View style={s.inputWrap}>
            <Feather name="mail" size={16} color={c.textTertiary} style={{ marginRight: 8 }} />
            <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="you@company.com" placeholderTextColor={c.textTertiary} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          </View>
          <Text style={s.label}>Password</Text>
          <View style={s.inputWrap}>
            <Feather name="lock" size={16} color={c.textTertiary} style={{ marginRight: 8 }} />
            <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="Enter your password" placeholderTextColor={c.textTertiary} secureTextEntry={!showPw} autoCapitalize="none" />
            <Pressable onPress={() => setShowPw(!showPw)} style={{ padding: 4 }}><Feather name={showPw ? 'eye-off' : 'eye'} size={16} color={c.textTertiary} /></Pressable>
          </View>

          <Pressable style={[s.button, loading && s.buttonDisabled]} onPress={handleAuth} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>}
          </Pressable>
          <Pressable onPress={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}>
            <Text style={s.toggle}>{isSignUp ? 'Already have an account? ' : "Don't have an account? "}<Text style={s.toggleBold}>{isSignUp ? 'Sign In' : 'Sign Up'}</Text></Text>
          </Pressable>

          {onDemoPress && (
            <>
              <View style={s.divider}><View style={s.dividerLine} /><Text style={s.dividerText}>or</Text><View style={s.dividerLine} /></View>
              <Pressable style={s.demoBtn} onPress={onDemoPress}>
                <Feather name="play" size={14} color={c.primary} /><Text style={s.demoBtnText}>Try the demo</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    wrapper: { flex: 1 },
    container: { flex: 1, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
    card: { width: '100%', maxWidth: 400, backgroundColor: c.card, borderRadius: 20, padding: 36, borderWidth: 1, borderColor: c.cardBorder },
    cardNative: { padding: 24, borderRadius: 16 },
    logoRow: { alignItems: 'center', marginBottom: 16 },
    logoIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: c.primaryLight, alignItems: 'center', justifyContent: 'center' },
    brand: { fontSize: 32, fontFamily: 'PlayfairDisplay_700Bold', color: c.text, textAlign: 'center', marginBottom: 4, letterSpacing: 0.5 },
    subtitle: { fontSize: 14, color: c.textSecondary, textAlign: 'center', marginBottom: 28 },
    label: { fontSize: 13, fontFamily: 'Jost_500Medium', color: c.text, marginBottom: 6, marginTop: 14 },
    inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.inputBg, borderRadius: 10, borderWidth: 1, borderColor: c.border, paddingHorizontal: 12 },
    input: { flex: 1, paddingVertical: 12, fontSize: 14, color: c.text, outlineStyle: 'none' } as any,
    button: { backgroundColor: c.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: '#fff', fontSize: 15, fontFamily: 'Jost_500Medium' },
    toggle: { textAlign: 'center', marginTop: 16, fontSize: 13, color: c.textSecondary },
    toggleBold: { color: c.primary, fontFamily: 'Jost_500Medium' },
    divider: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 14 },
    dividerLine: { flex: 1, height: 1, backgroundColor: c.border },
    dividerText: { marginHorizontal: 12, fontSize: 12, color: c.textTertiary },
    demoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: c.primaryLight },
    demoBtnText: { color: c.primary, fontSize: 14, fontFamily: 'Jost_500Medium', marginLeft: 6 },
    errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.dangerLight, borderRadius: 10, padding: 12, marginBottom: 4 },
    errorText: { color: c.danger, fontSize: 13, marginLeft: 8, flex: 1 },
    successBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.successLight, borderRadius: 10, padding: 12, marginBottom: 4 },
    successText: { color: c.success, fontSize: 13, marginLeft: 8, flex: 1 },
  });
}
