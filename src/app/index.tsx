import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { OnEspresso, Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';
import { authErrorMessage, useAuth } from '@/lib/auth-context';

/** Numbered pills narrating the passport ritual. */
const STEPS = [
  { number: '01', label: 'Ubica' },
  { number: '02', label: 'Sella' },
  { number: '03', label: 'Colecciona' },
] as const;

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { status, signIn, continueAsGuest } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError: setFieldError,
  } = useForm<LoginForm>({
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const submit = async ({ email, password }: LoginForm) => {
    setSubmitting(true);
    setFormError(null);
    try {
      await signIn(email, password);
      router.replace('/mapa');
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        for (const [field, messages] of Object.entries(error.fields)) {
          const key = field.toLowerCase();
          if ((key === 'email' || key === 'password') && messages[0]) {
            setFieldError(key, { type: 'api', message: messages[0] });
          }
        }
      }
      setFormError(authErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const enterAsGuest = () => {
    continueAsGuest();
    router.replace('/mapa');
  };

  if (status === 'loading') {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: theme.background }]}>
        <StatusBar style="auto" />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Recuperando tu sesión…
        </Text>
      </View>
    );
  }

  if (status === 'signedIn' || status === 'guest') {
    return <Redirect href="/mapa" />;
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.contentFrame}>
          <View
            style={[
              styles.content,
              {
                paddingTop: insets.top + Spacing.four,
                paddingBottom: insets.bottom + Spacing.five,
                paddingLeft: insets.left + Spacing.four,
                paddingRight: insets.right + Spacing.four,
              },
            ]}>
            {/* Brand lock-up */}
            <View style={styles.brandRow}>
              <View
                style={[
                  styles.brandMonogram,
                  { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
                ]}>
                <Text style={[styles.brandMonogramText, { color: theme.text }]}>CP</Text>
              </View>
              <View style={styles.brandCopy}>
                <Text style={[styles.brandName, { color: theme.text }]}>COFFEE PASSPORT</Text>
                <Text style={[styles.brandTag, { color: theme.textSecondary }]}>
                  TIJUANA · MÉXICO 2026
                </Text>
              </View>
            </View>

            {/* Editorial hero on espresso leather */}
            <View style={[styles.hero, { backgroundColor: theme.passportCover }]}>
              <View
                pointerEvents="none"
                style={[styles.heroSeal, { borderColor: OnEspresso.line }]}>
                <View style={[styles.heroSealInner, { borderColor: OnEspresso.line }]}>
                  <Text style={styles.heroSealTop}>CP</Text>
                  <View style={[styles.heroSealLine, { backgroundColor: OnEspresso.line }]} />
                  <Text style={styles.heroSealBottom}>2026</Text>
                </View>
              </View>

              <Text style={styles.heroOverline}>PASAPORTE OFICIAL</Text>
              <Text style={styles.heroTitle}>Cada café suma{'\n'}un sello a tu historia.</Text>
              <Text style={styles.heroSubtitle}>
                Visita barras de especialidad, valida tu ubicación y colecciona estampas
                auténticas de cada taza.
              </Text>

              <View style={styles.stepRow}>
                {STEPS.map((step) => (
                  <View key={step.number} style={styles.stepPill}>
                    <Text style={styles.stepNumber}>{step.number}</Text>
                    <Text style={styles.stepLabel}>{step.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Ivory access form */}
            <Card style={styles.formCard}>
              <View style={styles.formHeading}>
                <Text style={[styles.formTitle, { color: theme.text }]}>Inicia tu recorrido</Text>
                <Text style={[styles.formSubtitle, { color: theme.textSecondary }]}>
                  Entra con tu correo para registrar sellos.
                </Text>
              </View>

              <View style={styles.fields}>
                <Controller
                  control={control}
                  name="email"
                  rules={{
                    required: 'El correo electrónico es obligatorio.',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
                      message: 'Ingresa un correo válido, por ejemplo nombre@dominio.com.',
                    },
                  }}
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <Field
                      label="Correo electrónico"
                      icon="mail-outline"
                      placeholder="tu@correo.com"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={error?.message}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      returnKeyType="next"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="password"
                  rules={{
                    required: 'La contraseña es obligatoria.',
                    minLength: {
                      value: 8,
                      message: 'La contraseña debe tener al menos 8 caracteres.',
                    },
                  }}
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <Field
                      label="Contraseña"
                      icon="lock-closed-outline"
                      placeholder="Mínimo 8 caracteres"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={error?.message}
                      secureTextEntry
                      autoComplete="current-password"
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        void handleSubmit(submit)();
                      }}
                    />
                  )}
                />
              </View>

              {formError ? (
                <Text
                  accessibilityLiveRegion="polite"
                  style={[styles.formError, { color: theme.danger }]}>
                  {formError}
                </Text>
              ) : null}

              <Button
                label="Abrir mi pasaporte"
                icon="arrow-forward"
                loading={submitting}
                onPress={handleSubmit(submit)}
                style={styles.primaryButton}
              />

              <View style={styles.orRow}>
                <View style={[styles.orLine, { backgroundColor: theme.border }]} />
                <Text style={[styles.orText, { color: theme.textMuted }]}>o</Text>
                <View style={[styles.orLine, { backgroundColor: theme.border }]} />
              </View>

              <Button
                label="Explorar como invitado"
                variant="guest"
                icon="leaf-outline"
                onPress={enterAsGuest}
              />

              <Pressable
                onPress={() => router.push('/registro')}
                style={styles.registerRow}
                hitSlop={8}>
                <Text style={[styles.helper, { color: theme.textSecondary }]}>
                  ¿No tienes cuenta?
                </Text>
                <Text style={[styles.link, { color: theme.accentStrong }]}>Regístrate aquí</Text>
              </Pressable>
            </Card>

            <Text style={[styles.footnote, { color: theme.textMuted }]}>
              COFFEE PASSPORT · TIJUANA 2026
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  loadingText: {
    ...Type.caption,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentFrame: {
    width: '100%',
    maxWidth: 520,
  },
  content: {
    flexGrow: 1,
    gap: Spacing.four,
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
  },
  brandMonogram: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMonogramText: {
    ...Type.overline,
    fontSize: 11,
    letterSpacing: 0.5,
    fontWeight: '800',
  },
  brandCopy: {
    gap: 1,
  },
  brandName: {
    ...Type.overline,
    fontSize: 11,
    letterSpacing: 1.6,
  },
  brandTag: {
    ...Type.overline,
    fontSize: 9,
    letterSpacing: 1.4,
    fontWeight: '600',
  },
  hero: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#483120',
    padding: Spacing.four,
    gap: Spacing.three,
    overflow: 'hidden',
  },
  heroSeal: {
    position: 'absolute',
    right: -46,
    top: -34,
    width: 168,
    height: 168,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-14deg' }],
  },
  heroSealInner: {
    width: 136,
    height: 136,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  heroSealTop: {
    ...Type.overline,
    fontSize: 13,
    letterSpacing: 3,
    color: OnEspresso.line,
  },
  heroSealLine: {
    width: 46,
    height: StyleSheet.hairlineWidth,
  },
  heroSealBottom: {
    ...Type.overline,
    fontSize: 9,
    letterSpacing: 2.6,
    color: OnEspresso.line,
  },
  heroOverline: {
    ...Type.overline,
    color: OnEspresso.muted,
    letterSpacing: 1.8,
  },
  heroTitle: {
    ...Type.display,
    fontSize: 28,
    lineHeight: 33,
    letterSpacing: -0.7,
    color: OnEspresso.text,
  },
  heroSubtitle: {
    ...Type.body,
    color: OnEspresso.muted,
    maxWidth: 320,
  },
  stepRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two - 2,
    paddingHorizontal: Spacing.two + 4,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
    backgroundColor: OnEspresso.faint,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: OnEspresso.line,
  },
  stepNumber: {
    ...Type.overline,
    fontSize: 9,
    letterSpacing: 0.8,
    color: OnEspresso.text,
  },
  stepLabel: {
    ...Type.caption,
    fontSize: 11,
    fontWeight: '600',
    color: OnEspresso.text,
  },
  formCard: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  formHeading: {
    gap: Spacing.half + 1,
  },
  formTitle: {
    ...Type.title,
    fontSize: 24,
    lineHeight: 29,
  },
  formSubtitle: {
    ...Type.body,
  },
  fields: {
    gap: Spacing.three,
  },
  formError: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  helper: {
    ...Type.caption,
  },
  link: {
    ...Type.caption,
    fontWeight: '700',
  },
  primaryButton: {
    marginTop: Spacing.one,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  orText: {
    ...Type.overline,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    flexWrap: 'wrap',
  },
  footnote: {
    ...Type.overline,
    fontSize: 8,
    letterSpacing: 1.8,
    textAlign: 'center',
    fontWeight: '600',
  },
});
