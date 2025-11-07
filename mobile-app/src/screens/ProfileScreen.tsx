import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Card, Title, Paragraph, List, Button, Avatar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = ({ navigation }: any) => {
  const [user] = useState({
    name: 'Max Mustermann',
    email: 'max@beispiel.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    memberSince: '2023',
    rating: 4.8,
    reviews: 24,
  });

  const menuItems = [
    {
      title: 'Meine Uhren',
      icon: 'watch-outline',
      onPress: () => navigation.navigate('MyWatches'),
    },
    {
      title: 'Meine Gebote',
      icon: 'gavel-outline',
      onPress: () => navigation.navigate('MyBids'),
    },
    {
      title: 'Käufe',
      icon: 'bag-outline',
      onPress: () => navigation.navigate('Purchases'),
    },
    {
      title: 'Verkäufe',
      icon: 'storefront-outline',
      onPress: () => navigation.navigate('Sales'),
    },
    {
      title: 'Favoriten',
      icon: 'heart-outline',
      onPress: () => navigation.navigate('Favorites'),
    },
    {
      title: 'Nachrichten',
      icon: 'chatbubbles-outline',
      onPress: () => navigation.navigate('Messages'),
    },
    {
      title: 'Einstellungen',
      icon: 'settings-outline',
      onPress: () => navigation.navigate('Settings'),
    },
    {
      title: 'Hilfe & Support',
      icon: 'help-circle-outline',
      onPress: () => navigation.navigate('Help'),
    },
  ];

  const stats = [
    { label: 'Verkauft', value: '12' },
    { label: 'Gekauft', value: '8' },
    { label: 'Bewertungen', value: user.reviews.toString() },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <Avatar.Image
            size={80}
            source={{ uri: user.avatar }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Title style={styles.userName}>{user.name}</Title>
            <Paragraph style={styles.userEmail}>{user.email}</Paragraph>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text style={styles.rating}>{user.rating}</Text>
              <Text style={styles.reviews}>({user.reviews} Bewertungen)</Text>
            </View>
            <Text style={styles.memberSince}>Mitglied seit {user.memberSince}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Stats */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Menu Items */}
      <Card style={styles.menuCard}>
        <Card.Content style={styles.menuContent}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={24} color="#64748b" />
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </Card.Content>
      </Card>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Login')}
          style={styles.logoutButton}
          textColor="#ef4444"
        >
          Abmelden
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  profileCard: {
    margin: 16,
    elevation: 2,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 4,
  },
  reviews: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  memberSince: {
    fontSize: 12,
    color: '#64748b',
  },
  statsCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  menuCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  menuContent: {
    padding: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#0f172a',
    marginLeft: 16,
  },
  logoutContainer: {
    padding: 16,
  },
  logoutButton: {
    borderColor: '#ef4444',
  },
});

export default ProfileScreen;

