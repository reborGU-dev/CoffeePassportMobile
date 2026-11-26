import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ListRow } from '@/components/ui/list-row';
import { SectionHeader } from '@/components/ui/section-header';
import { StatDivider, StatItem } from '@/components/ui/stat';
import { SwitchRow } from '@/components/ui/switch-row';
import {
  Colors,
  CoffeeGradient,
  OnEspresso,
  Radius,
  Spacing,
  Type,
} from '@/constants/theme';
import { accountMenu, demoUser, helpMenu } from '@/data/demo';
import { usePassportData } from '@/hooks/use-passport-data';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { formatMonthYear, initialsFor } from '@/lib/format';

const POINTS_PER_LEVEL = 500;

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status, user, signOut } = useAuth();
  const { counts } = usePassportData();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  const displayName = user?.nombre ?? demoUser.name;
  const email = user?.email ?? demoUser.email;
  const initials = user ? initialsFor(displayName) : demoUser.initials;
  const levelLabel = user ? `Nivel ${user.nivel}` : 'Nivel 3';
  const points = user?.puntos ?? demoUser.points;
  const nextLevel = user
    ? (Math.floor(points / POINTS_PER_LEVEL) + 1) * POINTS_PER_LEVEL
    : demoUser.nextLevelPoints;
  const progress = Math.min(100, Math.round((points / nextLevel) * 100));
  const remaining = Math.max(0, nextLevel - points);
  const memberSince = user ? formatMonthYear(user.fechaRegistro) : demoUser.memberSince;

  const menu = accountMenu.map((item) => {
    if (item.id === 'favorites') {
      return { ...item, caption: `${counts.favoritas} guardadas` };
    }
    if (item.id === 'history') {
      return { ...item, caption: `${counts.sellos} sellos registrados` };
    }
    return item;
  });

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.five },
      ]}
      showsVerticalScrollIndicator={false}>

      {/* ══════════════════ HERO HEADER con gradiente ══════════════════ */}
      <LinearGradient
        colors={CoffeeGradient}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}>

        {/* Folio editorial */}
        <View style={styles.heroTopRow}>
          <Text style={styles.heroFolio}>COFFEE PASSPORT</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ajustes de cuenta"
            style={styles.heroSettingsBtn}>
            <Icon name="settings" size={17} color={OnEspresso.muted} />
          </Pressable>
        </View>

        {/* Avatar + info */}
        <View style={styles.heroProfile}>
          <Avatar initials={initials} size={76} ring />
          <View style={styles.heroInfo}>
            <View style={styles.heroNameRow}>
              <Text style={styles.heroName}>{displayName}</Text>
              {status === 'guest' ? (
                <Badge tone="muted">Invitado</Badge>
              ) : user?.rol === 'Admin' ? (
                <Badge tone="accent" icon="checkmark-circle">Admin</Badge>
              ) : (
                <Badge tone="accent" icon="checkmark-circle">{levelLabel}</Badge>
              )}
            </View>
            <Text style={styles.heroEmail}>{email}</Text>
            <View style={styles.heroMemberRow}>
              <Icon name="calendar-outline" size={11} color={OnEspresso.muted} />
              <Text style={styles.heroMember}>
                {user ? `Miembro desde ${memberSince}` : `${demoUser.city} · desde ${memberSince}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Acciones rápidas */}
        <View style={styles.heroActions}>
          <Button
            label="Editar perfil"
            size="sm"
            variant="secondary"
            icon="create-outline"
            iconPosition="left"
            fullWidth={false}
            style={styles.heroActionBtn}
          />
          <Button
            label="Compartir"
            size="sm"
            variant="ghost"
            icon="share-outline"
            iconPosition="left"
            fullWidth={false}
            style={styles.heroActionBtn}
          />
        </View>

        {/* Separador decorativo inferior */}
        <View style={styles.heroDivider} />
      </LinearGradient>

      {/* ══════════════════ MÉTRICAS ══════════════════ */}
      <View style={styles.section}>
        <Card>
          <View style={styles.statsRow}>
            <StatItem value={String(counts.sellos)} label="Sellos" />
            <StatDivider />
            <StatItem value={String(counts.resenas)} label="Reseñas" />
            <StatDivider />
            <StatItem value={String(counts.favoritas)} label="Favoritas" />
          </View>
        </Card>
      </View>

      {/* ══════════════════ NIVEL DE CATADOR ══════════════════ */}
      <View style={styles.section}>
        <Card style={styles.levelCard}>
          {/* Header del nivel */}
          <View style={styles.levelHeader}>
            <LinearGradient
              colors={['#2F4538', '#3D5C48']}
              style={styles.trophyTile}>
              <Icon name="trophy" size={22} color={OnEspresso.text} />
            </LinearGradient>
            <View style={styles.levelText}>
              <Text style={[styles.levelTitle, { color: theme.text }]}>
                {user ? levelLabel : demoUser.level}
              </Text>
              <Text style={[styles.levelCaption, { color: theme.textSecondary }]}>
                {points.toLocaleString()} / {nextLevel.toLocaleString()} pts
              </Text>
            </View>
            <Badge tone="accent">{levelLabel}</Badge>
          </View>

          {/* Barra de progreso */}
          <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSelected }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: Colors.light.accentProgress, width: `${progress}%` },
              ]}
            />
          </View>

          {/* Texto restante */}
          <Text style={[styles.levelHint, { color: theme.textSecondary }]}>
            {remaining > 0
              ? `Te faltan ${remaining} puntos para el siguiente nivel`
              : '¡Has alcanzado el nivel máximo! ☕'}
          </Text>
        </Card>
      </View>

      {/* ══════════════════ MI CUENTA ══════════════════ */}
      <View style={styles.section}>
        <SectionHeader title="Mi cuenta" />
        <Card padded={false}>
          {menu.map((item, index) => (
            <ListRow
              key={item.id}
              icon={item.icon}
              label={item.label}
              caption={item.caption}
              badge={item.badge}
              last={index === menu.length - 1}
            />
          ))}
        </Card>
      </View>

      {/* ══════════════════ PREFERENCIAS ══════════════════ */}
      <View style={styles.section}>
        <SectionHeader title="Preferencias" />
        <Card padded={false}>
          <SwitchRow
            icon="notifications"
            label="Notificaciones push"
            caption="Retos semanales y nuevas cafeterías"
            value={pushEnabled}
            onValueChange={setPushEnabled}
          />
          <SwitchRow
            icon="location"
            label="Ubicación precisa"
            caption="Necesaria para validar tus sellos"
            value={locationEnabled}
            onValueChange={setLocationEnabled}
            last
          />
        </Card>
      </View>

      {/* ══════════════════ SOPORTE ══════════════════ */}
      <View style={styles.section}>
        <SectionHeader title="Soporte" />
        <Card padded={false}>
          {helpMenu.map((item, index) => (
            <ListRow
              key={item.id}
              icon={item.icon}
              label={item.label}
              last={index === helpMenu.length - 1}
            />
          ))}
        </Card>
      </View>

      {/* ══════════════════ CERRAR SESIÓN ══════════════════ */}
      <View style={[styles.section, { paddingHorizontal: Spacing.four }]}>
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [
            styles.signOut,
            {
              borderColor: theme.border,
              backgroundColor: theme.backgroundElement,
            },
            pressed && { opacity: 0.65 },
          ]}>
          <Icon name="log-out" size={18} color={theme.danger} />
          <Text style={[styles.signOutText, { color: theme.danger }]}>
            {status === 'guest' ? 'Salir del modo invitado' : 'Cerrar sesión'}
          </Text>
        </Pressable>
      </View>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <View style={styles.footer}>
        <Text style={[styles.footerDot, { color: theme.textMuted }]}>·</Text>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>Coffee Passport · v1.0</Text>
        <Text style={[styles.footerDot, { color: theme.textMuted }]}>·</Text>
        <Text style={[styles.footerText, { color: theme.textMuted }]} numberOfLines={1}>
          {status === 'signedIn' ? 'Datos sincronizados' : 'Modo exploración'}
        </Text>
        <Text style={[styles.footerDot, { color: theme.textMuted }]}>·</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: 0,
  },

  /* ── Hero header ── */
  hero: {
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.four,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.three,
    overflow: 'hidden',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroFolio: {
    ...Type.overline,
    color: OnEspresso.muted,
    letterSpacing: 2,
  },
  heroSettingsBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,248,240,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: OnEspresso.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  heroInfo: {
    flex: 1,
    gap: 3,
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  heroName: {
    ...Type.heading,
    color: OnEspresso.text,
  },
  heroEmail: {
    ...Type.caption,
    color: OnEspresso.muted,
  },
  heroMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroMember: {
    ...Type.caption,
    color: OnEspresso.muted,
  },
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  heroActionBtn: {
    flexGrow: 1,
  },
  heroDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: OnEspresso.line,
    marginTop: Spacing.one,
  },

  /* ── Secciones ── */
  section: {
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },

  /* ── Stats ── */
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* ── Nivel de catador ── */
  levelCard: {
    gap: Spacing.three,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
  },
  trophyTile: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    flex: 1,
    gap: 2,
  },
  levelTitle: {
    ...Type.bodyStrong,
  },
  levelCaption: {
    ...Type.caption,
  },
  progressTrack: {
    height: 7,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  levelHint: {
    ...Type.caption,
    marginTop: -Spacing.one,
  },

  /* ── Cerrar sesión ── */
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.three,
  },
  signOutText: {
    ...Type.label,
    fontWeight: '700',
  },

  /* ── Footer ── */
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    flexWrap: 'wrap',
  },
  footerDot: {
    ...Type.caption,
  },
  footerText: {
    ...Type.caption,
  },
});
