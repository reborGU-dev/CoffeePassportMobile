import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';
import { authErrorMessage, useAuth } from '@/lib/auth-context';

type RegisterForm = {
  nombre: string;
  email: string;
  password: string;
};

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { signUp } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError: setFieldError,
  } = useForm<RegisterForm>({
    mode: 'onTouched',
    defaultValues: { nombre: '', email: '', password: '' },
  });

  const submit = async ({ nombre, email, password }: RegisterForm) => {
    setSubmitting(true);
    setFormError(null);
    try {
      await signUp(nombre, email, password);
      router.replace('/mapa');
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        for (const [field, messages] of Object.entries(error.fields)) {
          const key = field.toLowerCase();
          if ((key === 'nombre' || key === 'email' || key === 'password') && messages[0]) {
            setFieldError(key as keyof RegisterForm, { type: 'api', message: messages[0] });
          }
        }
      }
      setFormError(authErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

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
                paddingTop: insets.top + Spacing.three,
                paddingBottom: insets.bottom + Spacing.five,
                paddingLeft: insets.left + Spacing.four,
                paddingRight: insets.right + Spacing.four,
              },
            ]}>
            <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
              <Icon name="arrow-back" size={16} color={theme.text} />
              <Text style={[styles.backText, { color: theme.text }]}>Volver al acceso</Text>
            </Pressable>

            <View style={styles.hero}>
              <View
                style={[
                  styles.brandMonogram,
                  { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
                ]}>
                <Text style={[styles.brandMonogramText, { color: theme.text }]}>CP</Text>
              </View>
              <Text style={[styles.overline, { color: theme.textSecondary }]}>
                REGISTRO DE CATADOR
              </Text>
              <Text style={[styles.title, { color: theme.text }]}>
                Crea tu pasaporte cafetero
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Una cuenta te permite sellar cada visita, escribir reseñas y guardar tus cafeterías
                favoritas.
              </Text>
            </View>

            <Card style={styles.formCard}>
              <View style={styles.fields}>
                <Controller
                  control={control}
                  name="nombre"
                  rules={{
                    required: 'Escribe tu nombre.',
                    minLength: { value: 2, message: 'Usa al menos 2 caracteres.' },
                    maxLength: { value: 100, message: 'Máximo 100 caracteres.' },
                  }}
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <Field
                      label="Nombre completo"
                      icon="person-outline"
                      placeholder="Ana Torres"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={error?.message}
                      autoCapitalize="words"
                      autoComplete="name"
                      returnKeyType="next"
                    />
                  )}
                />

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
                    minLength: { value: 8, message: 'Debe tener al menos 8 caracteres.' },
                    validate: (value) =>
                      (/[A-Za-z]/.test(value) && /\d/.test(value)) ||
                      'Debe incluir al menos una letra y un número.',
                  }}
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <Field
                      label="Contraseña"
                      icon="lock-closed-outline"
                      placeholder="Mínimo 8, con letra y número"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={error?.message}
                      secureTextEntry
                      autoComplete="new-password"
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
                label="Crear mi pasaporte"
                icon="arrow-forward"
                loading={submitting}
                onPress={handleSubmit(submit)}
              />

              <View style={[styles.note, { backgroundColor: theme.accentSoft }]}>
                <Icon name="shield-checkmark-outline" size={15} color={theme.accentStrong} />
                <Text style={[styles.noteText, { color: theme.accentStrong }]}>
                  Tu correo se usa solo para iniciar sesión y guardar tus sellos.
                </Text>
              </View>

              <Pressable
                onPress={() => router.back()}
                style={styles.loginRow}
                hitSlop={8}>
                <Text style={[styles.helper, { color: theme.textSecondary }]}>
                  ¿Ya tienes pasaporte?
                </Text>
                <Text style={[styles.link, { color: theme.accentStrong }]}>Inicia sesión</Text>
              </Pressable>
            </Card>
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
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    alignSelf: 'flex-start',
  },
  backText: {
    ...Type.caption,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  hero: {
    gap: Spacing.two,
  },
  brandMonogram: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  brandMonogramText: {
    ...Type.overline,
    fontSize: 12,
    letterSpacing: 0.5,
    fontWeight: '800',
  },
  overline: {
    ...Type.overline,
    letterSpacing: 1.6,
  },
  title: {
    ...Type.title,
    fontSize: 28,
    lineHeight: 33,
  },
  subtitle: {
    ...Type.body,
  },
  formCard: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  fields: {
    gap: Spacing.three,
  },
  formError: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three - 2,
    paddingVertical: Spacing.two + 2,
  },
  noteText: {
    ...Type.caption,
    flex: 1,
    fontWeight: '600',
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    flexWrap: 'wrap',
  },
  helper: {
    ...Type.caption,
  },
  link: {
    ...Type.caption,
    fontWeight: '700',
  },
});
