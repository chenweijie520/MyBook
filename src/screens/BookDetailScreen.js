import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { bookApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BookDetailScreen = ({ route, navigation }) => {
  // 状态管理
  const { bookId } = route.params;
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);

  // 加载图书详情
  const loadBookDetail = async () => {
    try {
      setLoading(true);
      const response = await bookApi.getBookDetail(bookId);

      if (response.code === 0 && response.data) {
        const bookData = response.data;
        setBook({
          ...bookData,
          id: bookData.id || bookId,
//          firstImg: bookData.firstImg?.replace('localhost', '192.168.31.203')
          firstImg: bookData.firstImg?.replace('localhost', '192.168.43.166')
        });
      } else {
        console.error('获取图书详情失败:', response);
      }
    } catch (error) {
      console.error('加载图书详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadBookDetail();
  }, []);

  // 借阅处理
  const handleBorrow = async () => {
    try {
      setBorrowing(true);
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (!userInfo) {
        Alert.alert('Notice', 'Please login first');
        return;
      }

      const user = JSON.parse(userInfo);
      const response = await bookApi.borrowBook({
        bookId: book.id.toString(),
        bookState: "1",
        userName: user.userName,
        borrowId: ''
      });

      if (response.code === 0) {
        Alert.alert('Success', 'Book borrowed successfully', [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
              setTimeout(() => {
                const mainTabNavigator = navigation.getParent();
                if (mainTabNavigator) {
                  mainTabNavigator.navigate('ProfileTab', {
                    screen: 'Profile',
                    params: {
                      screen: 'BorrowInfo',
                      params: { refresh: true }
                    }
                  });
                }
              }, 100);
            }
          }
        ]);
      } else {
        Alert.alert('Failed', response.msg || 'Failed to borrow book. Please try again.');
      }
    } catch (error) {
      console.error('借阅失败:', error);
      Alert.alert('Error', 'Failed to borrow book. Please try again later.');
    } finally {
      setBorrowing(false);
    }
  };

  // 渲染状态卡片
  const renderStatus = () => {
    if (!book) return null;

    const stockCount = parseInt(book.stock);
    return (
      <View style={styles.statusCard}>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Status</Text>
          <Text style={[
            styles.statusValue,
            { color: stockCount > 0 ? '#4CAF50' : '#ff6b6b' }
          ]}>
            {stockCount > 0 ? 'Available' : 'Unavailable'}
          </Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Stock</Text>
          <Text style={styles.statusValue}>{stockCount}</Text>
        </View>
      </View>
    );
  };

  // 加载状态显示
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  // 错误状态显示
  if (!book) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={60} color="#ccc" />
        <Text style={styles.errorText}>Failed to load book information</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 图书基本信息 */}
      <View style={styles.header}>
        <View style={styles.bookImageContainer}>
          {book.firstImg ? (
            <Image
              source={{ uri: book.firstImg }}
              style={styles.bookImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImage}>
              <Icon name="image-not-supported" size={40} color="#999" />
            </View>
          )}
        </View>
        <View style={styles.bookInfo}>
          <Text style={styles.bookName}>{book.bookName}</Text>
          <Text style={styles.author}>Author: {book.supplier}</Text>
          <Text style={styles.createTime}>Published: {book.createTime?.split(' ')[0] || 'Unknown'}</Text>
          {parseInt(book.stock) > 0 && (
            <TouchableOpacity
              style={[
                styles.borrowButton,
                borrowing && styles.borrowButtonDisabled
              ]}
              onPress={handleBorrow}
              disabled={borrowing}
            >
              <Text style={styles.borrowButtonText}>
                {borrowing ? 'Borrowing...' : 'Borrow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderStatus()}

      {/* 图书简介 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Introduction</Text>
        <Text style={styles.introduction}>
          {book.describe || 'No introduction available'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
  },
  header: {
    backgroundColor: '#fff',
    padding: 15,
    flexDirection: 'row',
  },
  bookImageContainer: {
    width: 120,
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  bookImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookInfo: {
    flex: 1,
    marginLeft: 15,
  },
  bookName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  author: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  createTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  statusCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 15,
    padding: 15,
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 15,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  introduction: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    textAlign: 'justify',
  },
  borrowButton: {
    backgroundColor: '#1a73e8',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 4,
  },
  borrowButtonDisabled: {
    backgroundColor: '#ccc',
  },
  borrowButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default BookDetailScreen; 