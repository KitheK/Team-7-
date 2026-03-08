import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Platform, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { supabase } from '../../lib/supabase';
import type { Negotiation, TranscriptLine } from '../context/WorkspaceContext';

type Props = {
  negotiation: Negotiation;
  onClose: () => void;
};

export default function LiveTranscript({ negotiation, onClose }: Props) {
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [status, setStatus] = useState(negotiation.status);
  const [elapsed, setElapsed] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Timer
  useEffect(() => {
    if (status !== 'calling') return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  // Fetch existing transcript lines
  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { data } = await supabase
        .from('call_transcript_lines')
        .select('*')
        .eq('negotiation_id', negotiation.id)
        .order('timestamp_ms', { ascending: true });
      if (data) setLines(data as TranscriptLine[]);
    })();
  }, [negotiation.id]);

  // Realtime subscription for new transcript lines
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel(`transcript-${negotiation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_transcript_lines',
          filter: `negotiation_id=eq.${negotiation.id}`,
        },
        (payload) => {
          const newLine = payload.new as TranscriptLine;
          setLines(prev => [...prev, newLine]);
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe();

    return () => { supabase!.removeChannel(channel); };
  }, [negotiation.id]);

  // Realtime subscription for negotiation status changes
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel(`negotiation-status-${negotiation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'negotiations',
          filter: `id=eq.${negotiation.id}`,
        },
        (payload) => {
          const updated = payload.new as Negotiation;
          setStatus(updated.status);
        }
      )
      .subscribe();

    return () => { supabase!.removeChannel(channel); };
  }, [negotiation.id]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isActive = status === 'calling';

  const handleSaveTranscript = () => {
    if (lines.length === 0) return;
    const text = lines
      .map(l => `[${l.speaker === 'agent' ? 'AI Agent' : negotiation.vendor_name}]: ${l.content}`)
      .join('\n\n');
    const header = `Transcript — ${negotiation.vendor_name}\n${new Date().toLocaleString()}\n${'─'.repeat(40)}\n\n`;
    const fullText = header + text;

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(fullText);
      Alert.alert('Copied', 'Transcript copied to clipboard.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusDot, isActive && styles.statusDotActive]} />
          <Text style={styles.title}>
            {isActive ? 'Live call' : 'Call transcript'} — {negotiation.vendor_name}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {isActive && (
            <View style={styles.timerBadge}>
              <Feather name="clock" size={12} color={Colors.danger} />
              <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
            </View>
          )}
          {lines.length > 0 && (
            <Pressable onPress={handleSaveTranscript} style={styles.saveBtn}>
              <Feather name="download" size={14} color={Colors.primary} />
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
          )}
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={18} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={styles.transcriptScroll} contentContainerStyle={styles.transcriptContent}>
        {lines.length === 0 && isActive && (
          <View style={styles.waitingState}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.waitingText}>Waiting for call to connect...</Text>
          </View>
        )}
        {lines.length === 0 && !isActive && status === 'completed' && (
          <View style={styles.waitingState}>
            <Feather name="file-text" size={24} color={Colors.textTertiary} />
            <Text style={styles.waitingText}>Transcript will appear here once processing is complete.</Text>
          </View>
        )}
        {lines.map((line) => (
          <View
            key={line.id}
            style={[
              styles.bubble,
              line.speaker === 'agent' ? styles.bubbleAgent : styles.bubbleVendor,
            ]}
          >
            <Text style={styles.speakerLabel}>
              {line.speaker === 'agent' ? 'AI Agent' : negotiation.vendor_name}
            </Text>
            <Text style={styles.bubbleText}>{line.content}</Text>
          </View>
        ))}
        {!isActive && status === 'completed' && lines.length > 0 && (
          <View style={styles.callEndedBadge}>
            <Feather name="check-circle" size={14} color={Colors.success} />
            <Text style={styles.callEndedText}>Call ended</Text>
          </View>
        )}
      </ScrollView>

      {isActive && (
        <View style={styles.footer}>
          <View style={styles.pulseRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.pulseLabel}>Recording and streaming live</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.textTertiary,
  },
  statusDotActive: { backgroundColor: Colors.danger },
  title: { fontSize: 15, fontWeight: '700', color: Colors.text },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  timerText: { fontSize: 13, fontWeight: '600', color: Colors.danger },
  closeBtn: { padding: 4 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: 'rgba(231, 116, 73, 0.06)',
  },
  saveBtnText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  transcriptScroll: { maxHeight: 400, minHeight: 120 },
  transcriptContent: { padding: 16, gap: 10 },
  waitingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  waitingText: { fontSize: 13, color: Colors.textSecondary },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
  },
  bubbleAgent: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(30, 64, 175, 0.08)',
    borderBottomLeftRadius: 4,
  },
  bubbleVendor: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.inputBg,
    borderBottomRightRadius: 4,
  },
  speakerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textTertiary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bubbleText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  callEndedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    marginTop: 8,
  },
  callEndedText: { fontSize: 12, fontWeight: '600', color: Colors.success },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  pulseRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  pulseLabel: { fontSize: 12, color: Colors.textSecondary },
});
