import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { StampBadge } from '@/components/stamp-badge';
import { VisitCard } from '@/components/visit-card';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { OnEspresso, Radius, Spacing, Type } from '@/constants/theme';
import { demoUser } from '@/data/demo';
import { usePassportData } from '@/hooks/use-passport-data';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { formatMonthYear } from '@/lib/format';

const POINTS_PER_LEVEL = 500;

export default function PassportScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, status } = useAuth();
  const { stamps, visits, counts, loading, error, reload } = usePassportData();
  const [selectedCity, setSelectedCity] = useState<string>('Todos');

  const displayName = user?.nombre ?? demoUser.name;
  const memberSince = user ? formatMonthYear(user.fechaRegistro) : demoUser.memberSince;
  const passportNumber = user
    ? `CP-${new Date().getFullYear()}-${String(user.id).padStart(4, '0')}`
    : demoUser.passportNumber;
  const levelLabel = user ? `Nivel ${user.nivel}` : demoUser.level;
  const points = user?.puntos ?? demoUser.points;
  const levelFloor = user ? Math.floor(points / POINTS_PER_LEVEL) * POINTS_PER_LEVEL : 0;
  const nextLevel = levelFloor + POINTS_PER_LEVEL;
  const progress = user ? Math.min(1, (points - levelFloor) / POINTS_PER_LEVEL) : 0.8;
  const remaining = Math.max(0, nextLevel - points);

  const stats = [
    { id: 'stamps', label: 'Sellos', value: String(counts.sellos) },
    { id: 'cafes', label: 'Cafeterías', value: String(counts.cafeterias) },
    { id: 'cities', label: 'Ciudades', value: String(counts.ciudades) },
  ];

  // Filtros dinámicos de ciudades presentes en los sellos
  const cityFilters = useMemo(() => {
    const list = ['Todos'];
    const uniqueCities = Array.from(
      new Set(stamps.map((s) => s.city).filter((c) => Boolean(c && c.trim()))),
    );
    if (uniqueCities.length > 0) {
      list.push(...uniqueCities);
    } else {
      list.push('Tijuana', 'Ensenada');
    }
    return list;
  }, [stamps]);

  const filteredStamps = useMemo(() => {
    if (selectedCity === 'Todos') {
      return stamps;
    }
    return stamps.filter(
      (s) => s.city.toLowerCase() === selectedCity.toLowerCase() || (!s.city && s.locked),
    );
  }, [selectedCity, stamps]);

  return (
    <Screen contentStyle={styles.content}>
      {/* Header superior editorial */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.text }, Type.title]}>
            Mi pasaporte
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }, Type.overline]}>
            FOLIO {passportNumber} · {levelLabel}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Compartir pasaporte"
          style={[styles.iconButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <Icon name="share-outline" size={17} color={theme.text} />
        </Pressable>
      </View>

      {/* Cubierta de libreta artesanal de cuero café espresso */}
      <LinearGradient
        colors={[theme.passportCover, '#2B1A11', '#342115']}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={[styles.cover, { borderColor: theme.passportBorder }]}>
        {/* Marca de agua vintage con sello rotado */}
        <View style={styles.coverWatermark} pointerEvents="none">
          <Text style={styles.watermarkText}>CP</Text>
          <Text style={styles.watermarkSub}>MÉXICO</Text>
        </View>

        <View style={styles.coverBrandRow}>
          <View style={styles.coverBrand}>
            <View style={styles.coverBrandIcon}>
              <Icon name="cafe" size={14} color={OnEspresso.text} />
            </View>
            <Text style={[styles.coverBrandText, Type.overline]}>
              Pasaporte Cafetero
            </Text>
          </View>
          <View style={styles.coverCountry}>
            <Text style={[styles.coverCountryText, Type.overline]}>EDICIÓN TJ · 2026</Text>
          </View>
        </View>

        <View style={styles.coverNameBlock}>
          <Text style={[styles.coverLabel, Type.overline]}>TITULAR ACREDITADO</Text>
          <Text style={[styles.coverName, Type.heading]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.coverSince}>
            Miembro desde {memberSince} · Barra Oficial
          </Text>
        </View>

        {/* Bloque de estadísticas de libreta en 3 columnas */}
        <View style={styles.coverStats}>
          {stats.map((stat, index) => (
            <View key={stat.id} style={styles.coverStat}>
              {index > 0 ? <View style={styles.coverStatDivider} /> : null}
              <View style={styles.coverStatContent}>
                <Text style={styles.coverStatValue}>{stat.value}</Text>
                <Text style={[styles.coverStatLabel, Type.overline]}>{stat.label}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Barra de progreso de nivel en Verde Finca Botánico */}
        <View style={styles.progressBlock}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              {user
                ? `Nivel ${user.nivel} · faltan ${remaining} pts para el siguiente grado`
                : 'Progreso de catador · 2 sellos para subir de nivel'}
            </Text>
            <Text style={styles.progressValue}>
              {user ? `${points} / ${nextLevel} pts` : '420 / 500 pts'}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.round(progress * 100)}%`,
                  backgroundColor: theme.accentProgress,
                },
              ]}
            />
          </View>
        </View>
      </LinearGradient>

      {/* Banner de recompensa activa de barista en Verde Finca suave */}
      <View style={[styles.rewardBanner, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
        <View style={[styles.rewardIcon, { backgroundColor: theme.accent }]}>
          <Icon name="star" size={14} color={theme.onAccent} />
        </View>
        <View style={styles.rewardText}>
          <Text style={[styles.rewardTitle, { color: theme.accentStrong }]}>
            Bebida de cortesía disponible
          </Text>
          <Text style={[styles.rewardCaption, { color: theme.textSecondary }]}>
            Canjeable en barras seleccionadas al completar 5 sellos válidos.
          </Text>
        </View>
      </View>

      {status === 'guest' ? (
        <Pressable
          onPress={() => router.replace('/')}
          style={[styles.banner, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
          <Icon name="information-circle" size={18} color={theme.accentStrong} />
          <Text style={[styles.bannerText, { color: theme.accentStrong }]}>
            Estás explorando como invitado. Inicia sesión para sellar y guardar tus visitas.
          </Text>
          <Icon name="chevron-forward" size={14} color={theme.accentStrong} />
        </Pressable>
      ) : null}

      {error ? (
        <Pressable
          onPress={reload}
          style={[styles.banner, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
          <Icon name="cloud-offline" size={18} color={theme.danger} />
          <Text style={[styles.bannerText, { color: theme.danger }]}>{error}</Text>
          <Text style={[styles.retry, { color: theme.primary }]}>Reintentar</Text>
        </Pressable>
      ) : null}

      {/* Cabecera de la sección de sellos */}
      <SectionHeader
        title="Sellos en libreta"
        subtitle="Cada visita válida deja una marca única de cata"
        action="Ver historial"
      />

      {/* Barra de chips de filtro por ciudad */}
      <View style={styles.filterRow}>
        {cityFilters.map((city) => {
          const isActive = selectedCity === city;
          return (
            <Pressable
              key={city}
              accessibilityRole="button"
              accessibilityLabel={`Filtrar por ${city}`}
              onPress={() => setSelectedCity(city)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? theme.primary : theme.backgroundSecondary,
                  borderColor: isActive ? theme.primary : theme.border,
                },
              ]}>
              <Text
                style={[
                  styles.filterChipText,
                  { color: isActive ? theme.onPrimary : theme.textSecondary },
                  isActive && { fontWeight: '700' },
                ]}>
                {city}
                {city === 'Todos' ? ` (${stamps.length})` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Grilla editorial de sellos */}
      <View
        style={[
          styles.stampsCard,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Cargando tus sellos…
            </Text>
          </View>
        ) : filteredStamps.length === 0 ? (
          <View style={styles.emptyStamps}>
            <Icon name="cafe-outline" size={24} color={theme.textMuted} />
            <Text style={[styles.emptyStampsText, { color: theme.textSecondary }]}>
              No hay sellos registrados en {selectedCity}.
            </Text>
          </View>
        ) : (
          <View style={styles.stampsGrid}>
            {filteredStamps.map((stamp) => (
              <StampBadge key={stamp.id} stamp={stamp} style={styles.stampItem} />
            ))}
          </View>
        )}
      </View>

      {/* Últimas visitas */}
      <SectionHeader title="Últimas visitas" subtitle="Tus visitas validadas con QR" />

      <View style={styles.visits}>
        {visits.length > 0 ? (
          visits.map((visit) => <VisitCard key={visit.id} visit={visit} />)
        ) : (
          <View
            style={[
              styles.empty,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <Icon name="qr-code-outline" size={26} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }, Type.heading]}>
              Aún no hay visitas
            </Text>
            <Text style={[styles.emptyCaption, { color: theme.textSecondary }]}>
              Escanea el QR del mostrador de una cafetería para registrar tu primera visita y estampar tu sello.
            </Text>
            <Pressable
              onPress={() => router.push('/escanear')}
              style={[styles.emptyButton, { backgroundColor: theme.primary }]}>
              <Icon name="scan" size={16} color={theme.onPrimary} />
              <Text style={[styles.emptyButtonText, { color: theme.onPrimary }]}>
                Escanear QR de barra
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* CTA de reseña y nueva cafetería */}
      <Pressable
        onPress={() => router.push('/escanear')}
        style={[
          styles.reviewCta,
          { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
        ]}>
        <View style={[styles.reviewCtaIcon, { backgroundColor: theme.accentSoft }]}>
          <Icon name="chatbubble-ellipses" size={18} color={theme.accentStrong} />
        </View>
        <View style={styles.reviewCtaText}>
          <Text style={[styles.reviewCtaTitle, { color: theme.text }]}>
            ¿Visitaste una cafetería nueva?
          </Text>
          <Text style={[styles.reviewCtaCaption, { color: theme.textSecondary }]}>
            Escanea su QR y deja tu reseña para ganar un sello en tu pasaporte.
          </Text>
        </View>
        <Icon name="chevron-forward" size={14} color={theme.textSecondary} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.0,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cover: {
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.four,
    gap: Spacing.four,
    overflow: 'hidden',
  },
  coverWatermark: {
    position: 'absolute',
    right: -24,
    bottom: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,247,236,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-14deg' }],
  },
  watermarkText: {
    color: 'rgba(255,247,236,0.14)',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 2,
  },
  watermarkSub: {
    color: 'rgba(255,247,236,0.12)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  coverBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coverBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  coverBrandIcon: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255,247,236,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverBrandText: {
    color: OnEspresso.text,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  coverCountry: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,247,236,0.3)',
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 3,
  },
  coverCountryText: {
    color: OnEspresso.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  coverNameBlock: {
    gap: 3,
  },
  coverLabel: {
    color: '#8E7866',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  coverName: {
    color: OnEspresso.text,
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  coverSince: {
    color: OnEspresso.muted,
    fontSize: 11,
  },
  coverStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,247,236,0.08)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,247,236,0.12)',
    paddingVertical: Spacing.two + 4,
  },
  coverStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverStatDivider: {
    position: 'absolute',
    left: 0,
    top: 4,
    bottom: 4,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,247,236,0.2)',
  },
  coverStatContent: {
    alignItems: 'center',
    gap: 2,
  },
  coverStatValue: {
    color: OnEspresso.text,
    fontSize: 20,
    fontWeight: '800',
  },
  coverStatLabel: {
    color: OnEspresso.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  progressBlock: {
    gap: Spacing.one + 2,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  progressLabel: {
    color: OnEspresso.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  progressValue: {
    color: OnEspresso.text,
    fontSize: 10,
    fontWeight: '800',
  },
  progressTrack: {
    height: 7,
    borderRadius: Radius.pill,
    backgroundColor: '#342215',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  rewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.three,
  },
  rewardIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardText: {
    flex: 1,
    gap: 2,
  },
  rewardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  rewardCaption: {
    fontSize: 11,
    lineHeight: 16,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.three,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  retry: {
    fontSize: 12,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  filterChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stampsCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.four,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyStamps: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
    gap: Spacing.two,
  },
  emptyStampsText: {
    fontSize: 12,
  },
  stampsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.four,
  },
  stampItem: {
    width: '31%',
  },
  visits: {
    gap: Spacing.two,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.four,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyCaption: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 2,
    marginTop: Spacing.one,
  },
  emptyButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  reviewCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.three,
  },
  reviewCtaIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewCtaText: {
    flex: 1,
    gap: 2,
  },
  reviewCtaTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  reviewCtaCaption: {
    fontSize: 11,
    lineHeight: 16,
  },
});

