import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native'
import { Card, Title, Paragraph, Chip, FAB } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'

const HomeScreen = ({ navigation }: any) => {
  const [refreshing, setRefreshing] = useState(false)
  const [featuredWatches] = useState([
    {
      id: 1,
      title: 'Rolex Submariner Date 116610LN',
      brand: 'Rolex',
      price: 9200,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
      condition: 'Sehr gut',
      year: '2020',
      isAuction: true,
      timeLeft: '2d 14h 32m',
      bids: 23,
    },
    {
      id: 2,
      title: 'Omega Speedmaster Professional',
      brand: 'Omega',
      price: 3200,
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
      condition: 'Ausgezeichnet',
      year: '2019',
      isAuction: false,
    },
    {
      id: 3,
      title: 'Patek Philippe Calatrava 5196P',
      brand: 'Patek Philippe',
      price: 52000,
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      condition: 'Mint',
      year: '2018',
      isAuction: true,
      timeLeft: '5d 8h 15m',
      bids: 12,
    },
  ])

  const [categories] = useState([
    { name: 'Rolex', icon: 'diamond-outline', color: '#10b981' },
    { name: 'Omega', icon: 'flash-outline', color: '#ef4444' },
    { name: 'Patek Philippe', icon: 'star-outline', color: '#3b82f6' },
    { name: 'Vintage', icon: 'time-outline', color: '#f59e0b' },
    { name: 'Smartwatches', icon: 'phone-portrait-outline', color: '#8b5cf6' },
  ])

  const onRefresh = React.useCallback(() => {
    setRefreshing(true)
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false)
    }, 2000)
  }, [])

  const renderWatchCard = (watch: any) => (
    <TouchableOpacity
      key={watch.id}
      onPress={() => navigation.navigate('WatchDetail', { watch })}
      style={styles.watchCard}
    >
      <Card style={styles.card}>
        <Image source={{ uri: watch.image }} style={styles.watchImage} />
        <Card.Content style={styles.cardContent}>
          <View style={styles.brandContainer}>
            <Text style={styles.brand}>{watch.brand}</Text>
            <Chip style={styles.conditionChip} textStyle={styles.chipText}>
              {watch.condition}
            </Chip>
          </View>
          <Title style={styles.watchTitle} numberOfLines={2}>
            {watch.title}
          </Title>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>CHF {watch.price.toLocaleString()}</Text>
            {watch.isAuction && (
              <View style={styles.auctionInfo}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.timeLeft}>{watch.timeLeft}</Text>
                <Text style={styles.bids}>{watch.bids} Gebote</Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Entdecken Sie seltene</Text>
          <Text style={styles.heroSubtitle}>Luxusuhren</Text>
          <Text style={styles.heroDescription}>
            Kaufen, verkaufen und bieten Sie auf einzigartige Zeitmesser
          </Text>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Beliebte Marken</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category, index) => (
              <TouchableOpacity key={index} style={styles.categoryItem}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <Ionicons name={category.icon as any} size={24} color="white" />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Watches */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Empfohlene Uhren</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Alle anzeigen</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featuredWatches.map(renderWatchCard)}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB style={styles.fab} icon="plus" onPress={() => navigation.navigate('Sell')} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: '#0ea5e9',
    padding: 24,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fbbf24',
    textAlign: 'center',
    marginTop: 4,
  },
  heroDescription: {
    fontSize: 16,
    color: '#e0f2fe',
    textAlign: 'center',
    marginTop: 8,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  seeAll: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '500',
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  watchCard: {
    width: 280,
    marginRight: 16,
  },
  card: {
    elevation: 2,
  },
  watchImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  cardContent: {
    padding: 12,
  },
  brandContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brand: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  conditionChip: {
    backgroundColor: '#f1f5f9',
  },
  chipText: {
    fontSize: 10,
    color: '#64748b',
  },
  watchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  auctionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLeft: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
  },
  bids: {
    fontSize: 10,
    color: '#666',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0ea5e9',
  },
})

export default HomeScreen
