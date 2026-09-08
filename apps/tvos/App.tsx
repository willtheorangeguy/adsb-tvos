import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  BackHandler,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  aircraftCategory,
  formatAltitude,
  formatDistance,
  formatSpeed,
  matchesWatch,
  nearbyAlerts,
  proximity,
  type AircraftFilters,
  type Sighting,
  type WatchRule,
} from '@adsb/shared';
import {AircraftDetails} from './src/components/AircraftDetails';
import {RadarView} from './src/components/RadarView';
import {SettingsOverlay} from './src/components/SettingsOverlay';
import {TVButton} from './src/components/TVButton';
import {ShareSighting} from './src/components/ShareSighting';
import {loadSettings, saveSettings} from './src/settings';
import {readStored, writeStored} from './src/storage';
import {downloadFile} from './src/download';
import {s} from './src/appStyles';
import {captureMenuButton} from './src/remote';
import {useAdsbFeed} from './src/useAdsbFeed';

type Tab = 'Radar' | 'Overhead' | 'Tracked' | 'Sightings' | 'Coverage';
const tabs: {name: Tab; icon: string}[] = [
  {name: 'Radar', icon: '◎'},
  {name: 'Overhead', icon: '↗'},
  {name: 'Tracked', icon: '☆'},
  {name: 'Sightings', icon: '◷'},
  {name: 'Coverage', icon: '◉'},
];
const filters: AircraftFilters = {
  requirePosition: true,
  sortBy: 'distance',
  sortDirection: 'asc',
};
export default function App(): React.JSX.Element {
  const [settings, setSettings] = useState(() => loadSettings().config);
  const [tab, setTab] = useState<Tab>('Radar');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedHex, setSelectedHex] = useState<string>(() =>
    settings.demo ? 'A1B2C3' : '',
  );
  const [range, setRange] = useState(30);
  const [map, setMap] = useState(false);
  const [trails, setTrails] = useState(true);
  const [follow, setFollow] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All aircraft');
  const [watch, setWatch] = useState<WatchRule[]>(() =>
    readStored('adsb.watch.v1', []),
  );
  const [sightings, setSightings] = useState<Sighting[]>(() =>
    readStored('adsb.sightings.v1', []),
  );
  const [alertRadius, setAlertRadius] = useState<number>(() =>
    readStored('adsb.alertRadius', 15),
  );
  const [toast, setToast] = useState('');
  const [share, setShare] = useState<Sighting>();
  const [ruleKind, setRuleKind] = useState<WatchRule['kind']>('aircraft');
  const [ruleValue, setRuleValue] = useState('');
  const [now, setNow] = useState(Date.now());
  const feed = useAdsbFeed(settings, filters);
  useEffect(() => {
    if (!selectedHex && feed.aircraft[0]) setSelectedHex(feed.aircraft[0].hex);
  }, [feed.aircraft, selectedHex]);
  const alerts = useMemo(
    () => nearbyAlerts(feed.allAircraft, watch, alertRadius),
    [feed.allAircraft, watch, alertRadius],
  );
  const alerted = useRef(new Set<string>());
  useEffect(() => {
    const entering = alerts.filter(p => !alerted.current.has(p.hex));
    alerted.current = new Set(alerts.map(p => p.hex));
    if (entering.length)
      setToast(
        `${settings.demo ? 'Demo alert' : 'Nearby alert'} · ${entering
          .map(p => p.callsign || p.hex)
          .join(', ')} within ${alertRadius} nm`,
      );
  }, [alerts, alertRadius, settings.demo]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 7000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    captureMenuButton(settingsOpen || !!share || tab !== 'Radar');
    return () => captureMenuButton(false);
  }, [settingsOpen, share, tab]);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (share) setShare(undefined);
      else if (settingsOpen) setSettingsOpen(false);
      else if (tab !== 'Radar') setTab('Radar');
      else return false;
      return true;
    });
    return () => sub.remove();
  }, [settingsOpen, share, tab]);
  const aircraft = feed.aircraft.filter(
    p =>
      (p.distanceNm === undefined || p.distanceNm <= range) &&
      (category === 'All aircraft' || aircraftCategory(p) === category) &&
      `${p.callsign} ${p.hex} ${p.registration} ${p.aircraftType} ${p.operator}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const selected = aircraft.find(p => p.hex === selectedHex) ?? aircraft[0];
  const localSightings = sightings.filter(s => s.demo === settings.demo);
  const stale =
    !!feed.error ||
    (!!feed.asOfMs && now - feed.asOfMs > Math.max(20000, settings.pollMs * 3));
  const persistWatch = (next: WatchRule[]) => {
    setWatch(next);
    writeStored('adsb.watch.v1', next);
  };
  const toggleTrack = () => {
    if (!selected) return;
    const exact = watch.find(
      r => r.kind === 'aircraft' && r.value === selected.hex,
    );
    if (exact) persistWatch(watch.filter(r => r.id !== exact.id));
    else
      persistWatch([
        ...watch,
        {
          id: `aircraft-${selected.hex}`,
          kind: 'aircraft',
          value: selected.hex,
          label: selected.registration || selected.callsign || selected.hex,
        },
      ]);
    setToast(
      exact
        ? 'Aircraft removed from your watchlist'
        : 'Aircraft tracked · Nearby alerts are active while the app is open',
    );
  };
  const logSighting = () => {
    if (!selected) return;
    const stamp = Date.now();
    const next = [
      {
        id: `${selected.hex}-${stamp}`,
        savedAt: stamp,
        demo: settings.demo,
        aircraft: {...selected, trail: selected.trail.slice(-30)},
      },
      ...sightings,
    ].slice(0, 500);
    setSightings(next);
    writeStored('adsb.sightings.v1', next);
    setToast(`Sighting saved · ${selected.callsign || selected.hex}`);
  };
  const addRule = () => {
    const value = ruleValue.trim().toUpperCase();
    if (!value) {
      setToast('Enter a registration, ICAO hex, type code or category');
      return;
    }
    if (
      ruleKind === 'category' &&
      !['LIGHT', 'LARGE', 'HELICOPTER', 'OTHER'].includes(value)
    ) {
      setToast('Categories: Light, Large, Helicopter, Other');
      return;
    }
    const id = `${ruleKind}-${value}`;
    if (!watch.some(r => r.id === id))
      persistWatch([...watch, {id, kind: ruleKind, value, label: value}]);
    setRuleValue('');
    setToast('Watch rule saved');
  };
  const exportLog = () => {
    if (Platform.OS === 'web') {
      downloadFile(
        JSON.stringify(localSightings, null, 2),
        'adsb-sightings.json',
        'application/json',
      );
    } else if (localSightings[0]) setShare(localSightings[0]);
  };
  const maxDistance = Math.max(
    0,
    ...feed.allAircraft.map(p => p.distanceNm ?? 0),
  );
  const overhead = aircraft.filter(
    p => !p.stale && p.distanceNm !== undefined && p.distanceNm <= 30,
  );
  const selectedExactTracked =
    !!selected &&
    watch.some(r => r.kind === 'aircraft' && r.value === selected.hex);
  return (
    <View style={s.root}>
      <View style={s.header}>
        <View style={s.brand}>
          <View style={s.brandIcon}>
            <Text style={s.brandPlane}>✈</Text>
          </View>
          <View>
            <Text style={s.brandName}>
              ADS-B <Text style={{color: '#25df9b'}}>TV</Text>
            </Text>
            <Text style={s.brandSub}>A WINDOW INTO YOUR SKY</Text>
          </View>
        </View>
        <View style={s.tabs}>
          {tabs.map(t => (
            <TVButton
              key={t.name}
              label={`${t.icon}  ${t.name}`}
              active={tab === t.name && !settingsOpen}
              onPress={() => {
                setTab(t.name);
                setSettingsOpen(false);
                setShare(undefined);
              }}
              style={s.tab}
            />
          ))}
        </View>
        <TVButton
          label="⚙  Settings"
          active={settingsOpen}
          onPress={() => {
            setSettingsOpen(!settingsOpen);
            setShare(undefined);
          }}
        />
      </View>
      {settingsOpen ? (
        <SettingsOverlay
          initial={settings}
          onCancel={() => setSettingsOpen(false)}
          onSave={next => {
            saveSettings(next);
            setSettings(next);
            setSelectedHex(next.demo ? 'A1B2C3' : '');
            setSettingsOpen(false);
            setToast(
              next.demo
                ? 'Demo ready · All traffic is synthetic'
                : 'Connecting to your local receiver…',
            );
          }}
        />
      ) : share ? (
        <ShareSighting sighting={share} onClose={() => setShare(undefined)} />
      ) : (
        <>
          <View style={s.titlebar}>
            <View>
              <Text style={s.title}>
                {tab === 'Radar'
                  ? 'Your sky, right now.'
                  : tab === 'Overhead'
                  ? 'Look up. Know what’s there.'
                  : tab === 'Tracked'
                  ? 'Worth keeping an eye on.'
                  : tab === 'Sightings'
                  ? 'Every sighting has a story.'
                  : 'See how far you can hear.'}
              </Text>
              <Text style={s.subtitle}>
                {settings.demo
                  ? 'San Francisco Bay Area  ·  Demo receiver'
                  : feed.receiver
                  ? `${feed.receiver.lat.toFixed(
                      3,
                    )}°, ${feed.receiver.lon.toFixed(
                      3,
                    )}°  ·  Your local receiver`
                  : 'Your local receiver  ·  Location not provided'}
              </Text>
            </View>
            <View style={s.statusPill}>
              <Text style={[s.statusText, stale && {color: '#ffb174'}]}>
                {settings.demo
                  ? '◉  DEMO'
                  : stale
                  ? '○  DISCONNECTED'
                  : feed.loading
                  ? '◌  CONNECTING'
                  : '●  RECEIVER CONNECTED'}
              </Text>
              <Text style={s.statusSub}>
                {feed.loading
                  ? 'Listening for aircraft'
                  : `${feed.allAircraft.length} aircraft  ·  ${
                      settings.pollMs / 1000
                    }s refresh`}
              </Text>
            </View>
          </View>
          {!!feed.error && (
            <Text accessibilityRole="alert" style={s.error}>
              Receiver unavailable · {feed.error}. Retrying automatically. Check
              Settings.
            </Text>
          )}
          {!feed.receiver && !feed.loading && !feed.error && (
            <Text style={s.error}>
              Receiver location unavailable. Set coordinates in Settings to
              enable distance, range and overhead direction.
            </Text>
          )}
          {tab === 'Radar' ? (
            <View style={s.layout}>
              <View style={s.left}>
                <View style={s.toolbar}>
                  <View style={s.searchBox}>
                    <Text style={s.searchIcon}>⌕</Text>
                    <TextInput
                      accessibilityLabel="Search aircraft"
                      placeholder="Callsign, registration or type"
                      placeholderTextColor="#718596"
                      value={search}
                      onChangeText={setSearch}
                      style={s.search}
                    />
                  </View>
                  <TVButton
                    label={`${range} nm ⌄`}
                    onPress={() =>
                      setRange(range === 30 ? 75 : range === 75 ? 150 : 30)
                    }
                  />
                  <TVButton
                    label={
                      category === 'All aircraft'
                        ? 'All types ⌄'
                        : `${category} ⌄`
                    }
                    active={category !== 'All aircraft'}
                    onPress={() => {
                      const options = [
                        'All aircraft',
                        'Large',
                        'Light',
                        'Helicopter',
                        'Other',
                      ];
                      setCategory(
                        options[
                          (options.indexOf(category) + 1) % options.length
                        ]!,
                      );
                    }}
                  />
                </View>
                <RadarView
                  aircraft={aircraft}
                  receiver={feed.receiver}
                  selectedHex={selected?.hex}
                  range={range}
                  map={map}
                  trails={trails}
                  onSelect={setSelectedHex}
                  follow={follow}
                />
                <View style={s.mapControls}>
                  <TVButton
                    label={map ? '◉  Map on' : '◉  Radar only'}
                    active={map}
                    onPress={() => setMap(!map)}
                  />
                  <TVButton
                    label="⌁  Trails"
                    active={trails}
                    onPress={() => setTrails(!trails)}
                  />
                  <TVButton
                    label={follow ? '◎  Recenter' : '↗  Follow selected'}
                    active={follow}
                    onPress={() => setFollow(!follow)}
                  />
                  <Text style={s.mapCount}>{aircraft.length} in range</Text>
                </View>
                <View style={s.nearbyTitle}>
                  <Text style={s.sectionTitle}>Nearby aircraft</Text>
                  <Text style={s.subtle}>
                    Closest first · Select to explore
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={s.nearby}
                  contentContainerStyle={{gap: 12}}>
                  {aircraft.map((p, i) => (
                    <TVButton
                      key={p.hex}
                      label={`View ${p.callsign || p.hex}`}
                      active={p.hex === selected?.hex}
                      onPress={() => setSelectedHex(p.hex)}
                      preferred={i === 0}
                      style={s.aircraftCard}>
                      <View style={s.cardTop}>
                        <Text style={s.cardPlane}>✈</Text>
                        <Text style={s.cardCallsign}>
                          {p.callsign || p.hex}
                        </Text>
                        <Text style={s.cardDistance}>{formatDistance(p)}</Text>
                      </View>
                      <Text style={s.cardOperator} numberOfLines={1}>
                        {p.operator || p.registration || 'Local aircraft'}
                      </Text>
                      <Text style={s.cardMetrics}>
                        {formatAltitude(p)} · {formatSpeed(p)}
                      </Text>
                    </TVButton>
                  ))}
                  {!aircraft.length && (
                    <Text style={s.empty}>
                      No aircraft match this view. Try another range or clear
                      your filters.
                    </Text>
                  )}
                </ScrollView>
              </View>
              <View style={s.right}>
                <AircraftDetails
                  aircraft={selected}
                  receiver={feed.receiver}
                  tracked={selectedExactTracked}
                  onTrack={toggleTrack}
                  onSave={logSighting}
                  demo={settings.demo}
                />
              </View>
            </View>
          ) : tab === 'Overhead' ? (
            <View style={s.layout}>
              <View style={s.widePanel}>
                <Text style={s.eyebrow}>YOUR TV’S GUIDE TO THE SKY</Text>
                <Text style={s.panelTitle}>Overhead & approaching</Text>
                <Text style={s.panelHint}>
                  Within 30 nm of your receiver. Bearings point from the
                  receiver toward the aircraft.
                </Text>
                <ScrollView style={{marginTop: 25}}>
                  {overhead.map(p => {
                    const a = proximity(p, feed.receiver);
                    return (
                      <TVButton
                        key={p.hex}
                        label={`Inspect overhead ${p.callsign || p.hex}`}
                        onPress={() => {
                          setSelectedHex(p.hex);
                          setTab('Radar');
                        }}
                        style={s.listRow}>
                        <Text style={s.direction}>{a?.direction ?? '—'}</Text>
                        <View style={{flex: 1}}>
                          <Text style={s.rowTitle}>{p.callsign || p.hex}</Text>
                          <Text style={s.subtle}>
                            {p.aircraftType || 'Unknown type'} ·{' '}
                            {formatAltitude(p)} · Bearing{' '}
                            {Math.round(a?.bearing ?? 0)}°
                          </Text>
                        </View>
                        <View>
                          <Text style={s.rowValue}>{formatDistance(p)}</Text>
                          <Text style={s.subtle}>
                            {a?.minutes !== undefined
                              ? `Closest in ≈ ${Math.max(
                                  1,
                                  Math.round(a.minutes),
                                )} min`
                              : 'Passing nearby'}
                          </Text>
                        </View>
                      </TVButton>
                    );
                  })}
                  {!overhead.length && (
                    <Text style={s.empty}>
                      {feed.receiver
                        ? 'No fresh aircraft within 30 nm.'
                        : 'Add receiver coordinates in Settings to find nearby aircraft.'}
                    </Text>
                  )}
                </ScrollView>
                <Text style={s.panelHint}>
                  TV adaptation of point & identify. Closest approach assumes a
                  constant heading and speed; it is not a flight prediction.
                </Text>
              </View>
              <View style={s.infoPanel}>
                <Text style={s.hugeIcon}>↗</Text>
                <Text style={s.panelTitle}>A little closer to the sky.</Text>
                <Text style={s.panelHint}>
                  Find the direction, look outside, and put a callsign to the
                  aircraft overhead.
                </Text>
                <Text style={s.panelHint}>
                  Apple TV has no camera or compass. Directions are geographic
                  bearings from your receiver.
                </Text>
                <TVButton
                  label="◎  Back to radar"
                  onPress={() => setTab('Radar')}
                  primary
                />
              </View>
            </View>
          ) : tab === 'Tracked' ? (
            <View style={s.layout}>
              <View style={s.widePanel}>
                <View style={s.row}>
                  <View>
                    <Text style={s.panelTitle}>Your watchlist</Text>
                    <Text style={s.panelHint}>
                      Registrations, ICAO addresses, types and categories.
                    </Text>
                  </View>
                  <TVButton
                    label={`Alerts within ${alertRadius} nm`}
                    active
                    onPress={() => {
                      const next =
                        alertRadius === 5 ? 15 : alertRadius === 15 ? 30 : 5;
                      setAlertRadius(next);
                      writeStored('adsb.alertRadius', next);
                    }}
                  />
                </View>
                <View style={s.ruleBar}>
                  {(['aircraft', 'type', 'category'] as const).map(kind => (
                    <TVButton
                      key={kind}
                      label={
                        kind === 'aircraft'
                          ? 'Aircraft'
                          : kind === 'type'
                          ? 'Type'
                          : 'Category'
                      }
                      active={ruleKind === kind}
                      onPress={() => setRuleKind(kind)}
                    />
                  ))}
                </View>
                <View style={s.ruleBar}>
                  <TextInput
                    accessibilityLabel="Watch rule"
                    style={s.ruleInput}
                    value={ruleValue}
                    onChangeText={setRuleValue}
                    autoCapitalize="characters"
                    placeholder={
                      ruleKind === 'aircraft'
                        ? 'Registration or ICAO hex, e.g. N172SP'
                        : ruleKind === 'type'
                        ? 'Type code, e.g. B738'
                        : 'Light, Large, Helicopter or Other'
                    }
                    placeholderTextColor="#718596"
                  />
                  <TVButton label="＋  Add watch" onPress={addRule} primary />
                </View>
                <ScrollView>
                  {watch.map(rule => (
                    <View key={rule.id} style={s.savedRow}>
                      <View style={{flex: 1}}>
                        <Text style={s.rowTitle}>☆ {rule.label}</Text>
                        <Text style={s.subtle}>
                          {rule.kind} ·{' '}
                          {
                            feed.allAircraft.filter(p => matchesWatch(p, rule))
                              .length
                          }{' '}
                          currently received
                        </Text>
                      </View>
                      <TVButton
                        label={`Remove ${rule.label}`}
                        onPress={() =>
                          persistWatch(watch.filter(r => r.id !== rule.id))
                        }
                      />
                    </View>
                  ))}
                  {!watch.length && (
                    <Text style={s.empty}>
                      Your watchlist is ready for its first aircraft. Select one
                      on Radar and choose Track aircraft.
                    </Text>
                  )}
                </ScrollView>
              </View>
              <View style={s.infoPanel}>
                <Text style={s.eyebrow}>NEARBY NOW</Text>
                <Text style={s.bigStat}>
                  {alerts.length.toString().padStart(2, '0')}
                </Text>
                <Text style={s.panelTitle}>Watched aircraft in range</Text>
                {alerts.map(p => (
                  <Text key={p.hex} style={s.greenText}>
                    {p.callsign || p.hex} · {formatDistance(p)}
                  </Text>
                ))}
                <Text style={s.panelHint}>
                  An on-screen alert appears when a watched aircraft enters your
                  alert radius. Alerts run while the app is open.
                </Text>
                <Text style={s.panelHint}>
                  Type and category rules need those fields in your receiver
                  feed.
                </Text>
              </View>
            </View>
          ) : tab === 'Sightings' ? (
            <View style={s.widePanel}>
              <View style={s.row}>
                <View>
                  <Text style={s.panelTitle}>
                    Your personal logbook{' '}
                    <Text style={s.greenText}>
                      {' '}
                      / {settings.demo ? 'Demo' : 'Local'}
                    </Text>
                  </Text>
                  <Text style={s.panelHint}>
                    Saved on this device · {localSightings.length} sightings ·{' '}
                    {new Set(localSightings.map(x => x.aircraft.hex)).size}{' '}
                    unique aircraft
                  </Text>
                </View>
                {localSightings.length > 0 && (
                  <TVButton
                    label={
                      Platform.OS === 'web'
                        ? '↓  Export logbook'
                        : '↗  Share latest'
                    }
                    onPress={exportLog}
                  />
                )}
              </View>
              <ScrollView style={{marginTop: 24}}>
                {localSightings.map(item => (
                  <View key={item.id} style={s.savedRow}>
                    <Text style={s.cardPlane}>✈</Text>
                    <View style={{flex: 1}}>
                      <Text style={s.rowTitle}>
                        {item.aircraft.callsign || item.aircraft.hex}{' '}
                        <Text style={s.subtle}>
                          {' '}
                          · {item.aircraft.registration || item.aircraft.hex}
                        </Text>
                      </Text>
                      <Text style={s.subtle}>
                        {new Date(item.savedAt).toLocaleString()} ·{' '}
                        {formatAltitude(item.aircraft)} ·{' '}
                        {formatDistance(item.aircraft)}
                      </Text>
                    </View>
                    <TVButton
                      label={`Share ${
                        item.aircraft.callsign || item.aircraft.hex
                      }`}
                      onPress={() => setShare(item)}
                    />
                    <TVButton
                      label={`Delete ${
                        item.aircraft.callsign || item.aircraft.hex
                      } sighting`}
                      onPress={() => {
                        const next = sightings.filter(x => x.id !== item.id);
                        setSightings(next);
                        writeStored('adsb.sightings.v1', next);
                        setToast('Sighting deleted');
                      }}
                    />
                  </View>
                ))}
                {!localSightings.length && (
                  <View style={s.emptyLog}>
                    <Text style={s.hugeIcon}>◷</Text>
                    <Text style={s.panelTitle}>The next one is a keeper.</Text>
                    <Text style={s.panelHint}>
                      Choose an aircraft on Radar, then Log sighting to save its
                      details.
                    </Text>
                    <TVButton
                      label="Explore the radar"
                      onPress={() => setTab('Radar')}
                      primary
                    />
                  </View>
                )}
              </ScrollView>
            </View>
          ) : (
            <View style={s.layout}>
              <View style={s.left}>
                <RadarView
                  aircraft={feed.aircraft}
                  receiver={feed.receiver}
                  selectedHex={selected?.hex}
                  range={150}
                  map={false}
                  trails
                  onSelect={hex => {
                    setSelectedHex(hex);
                    setTab('Radar');
                  }}
                />
                <Text style={s.panelHint}>
                  Current received positions and recent session trails · range
                  rings in nautical miles
                </Text>
              </View>
              <View style={s.infoPanel}>
                <Text style={s.eyebrow}>YOUR RECEIVER’S REACH</Text>
                <Text style={s.bigStat}>
                  {maxDistance.toFixed(1)}
                  <Text style={{fontSize: 30}}> nm</Text>
                </Text>
                <Text style={s.panelTitle}>Farthest currently received</Text>
                <View style={s.coverageStat}>
                  <Text style={s.subtle}>Aircraft with positions</Text>
                  <Text style={s.rowTitle}>{feed.aircraft.length}</Text>
                </View>
                <View style={s.coverageStat}>
                  <Text style={s.subtle}>Fresh signals</Text>
                  <Text style={s.rowTitle}>
                    {feed.allAircraft.filter(p => !p.stale).length}
                  </Text>
                </View>
                <View style={s.coverageStat}>
                  <Text style={s.subtle}>Stale signals</Text>
                  <Text style={s.rowTitle}>
                    {feed.allAircraft.filter(p => p.stale).length}
                  </Text>
                </View>
                <Text style={s.panelHint}>
                  Choose 30, 75 or 150 nm on Radar. Your antenna and receiver
                  determine actual coverage; there are no account-based range
                  limits.
                </Text>
                <TVButton
                  label="⚙  Receiver settings"
                  onPress={() => setSettingsOpen(true)}
                />
              </View>
            </View>
          )}
        </>
      )}
      <View style={s.footer}>
        <Text style={s.footerText}>
          <Text style={{color: '#24de9a'}}>●</Text>{' '}
          {settings.demo
            ? 'DEMO TRAFFIC · NOT LIVE FLIGHTS'
            : stale
            ? 'CONNECTION LOST · LAST RECEIVED POSITIONS'
            : 'LOCAL FEED · YOUR RECEIVER, YOUR DATA'}
        </Text>
        <Text style={s.footerText}>
          {Platform.OS === 'web'
            ? 'Arrow keys to navigate   ·   Enter to select   ·   Esc to go back'
            : 'Use the remote to explore   ·   Select to open   ·   Menu to go back'}
        </Text>
        <Text style={s.footerTime}>
          {new Date(now).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      {!!toast && (
        <View accessibilityRole="alert" style={s.toast}>
          <Text style={s.toastText}>{toast}</Text>
          <TVButton
            label="Dismiss"
            onPress={() => setToast('')}
            style={{paddingVertical: 7}}
          />
        </View>
      )}
    </View>
  );
}
