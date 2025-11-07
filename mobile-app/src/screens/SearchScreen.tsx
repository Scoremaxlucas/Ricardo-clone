import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Searchbar, Card, Title, Paragraph, Chip, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const SearchScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const filters = [
    { id: 'rolex', name: 'Rolex', color: '#10b981' },
    { id: 'omega', name: 'Omega', color: '#ef4444' },
    { id: 'patek', name: 'Patek Philippe', color: '#3b82f6' },
    { id: 'vintage', name: 'Vintage', color: '#f59e0b' },
    { id: 'auction', name: 'Auktion', color: '#8b5cf6' },
  ];

  const watches = [
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
  ];

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const renderWatchItem = ({ item }: any) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('WatchDetail', { watch: item })}
      style={styles.watchItem}
    >
      <Card style={styles.card}>
        <Image source={{ uri: item.image }} style={styles.watchImage} />
        <Card.Content style={styles.cardContent}>
          <View style={styles.brandContainer}>
            <Text style={styles.brand}>{item.brand}</Text>
            <Chip style={styles.conditionChip} textStyle={styles.chipText}>
              {item.condition}
            </Chip>
          </View>
          <Title style={styles.watchTitle} numberOfLines={2}>
            {item.title}
          </Title>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>CHF {item.price.toLocaleString()}</Text>
            {item.isAuction && (
              <View style={styles.auctionInfo}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.timeLeft}>{item.timeLeft}</Text>
                <Text style={styles.bids}>{item.bids} Gebote</Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Welche Uhr suchen Sie?"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Filter</Text>
        <View style={styles.filters}>
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => toggleFilter(filter.id)}
              style={[
                styles.filterChip,
                selectedFilters.includes(filter.id) && styles.filterChipSelected,
                { borderColor: filter.color }
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilters.includes(filter.id) && { color: filter.color }
                ]}
              >
                {filter.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>{watches.length} Uhren gefunden</Text>
        <Button
          mode="outlined"
          onPress={() => {/* Sort functionality */}}
          style={styles.sortButton}
        >
          Sortieren
        </Button>
      </View>

      <FlatList
        data={watches}
        renderItem={renderWatchItem}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f8fafc',
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: 'white',
  },
  filterChipSelected: {
    backgroundColor: '#f0f9ff',
  },
  filterText: {
    fontSize: 14,
    color: '#64748b',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: '#64748b',
  },
  sortButton: {
    borderColor: '#0ea5e9',
  },
  listContainer: {
    padding: 8,
  },
  watchItem: {
    flex: 1,
    margin: 8,
  },
  card: {
    elevation: 2,
  },
  watchImage: {
    width: '100%',
    height: 150,
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
    fontSize: 12,
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
    fontSize: 14,
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
});

export default SearchScreen;

