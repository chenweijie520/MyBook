import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { bookApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BorrowInfoScreen = ({ navigation, route }) => {
  // 状态管理
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
// 加载借阅列表
  const loadBorrowList = async () => {
    try {
      setLoading(true);
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (!userInfo) return;

      const user = JSON.parse(userInfo);
      console.log('Loading borrow list for user:', user.userName);

      const response = await bookApi.getBorrowList({
        pageNum: 1,
        pageSize: 100,
        userName: user.userName,
        bookName: '',
        supplier: '',
        bookState: '1'  // 1表示借阅中
      });

      console.log('Borrow list response:', response);

      if (response.code === 0 && response.data?.data?.list) {
        const borrowList = response.data.data.list || [];
        console.log('Current borrow list:', borrowList);
        setBorrowedBooks(borrowList);
      }
    } catch (error) {
      console.error('Load borrow list error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
// 监听页面焦点
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadBorrowList();
    });

    return unsubscribe;
  }, [navigation]);
// 监听路由参数变化
  useEffect(() => {
    if (route.params?.refresh) {
      loadBorrowList();
    }
  }, [route.params?.refresh]);
// 下拉刷新处理
  const handleRefresh = () => {
    setRefreshing(true);
    loadBorrowList();
  };
// 归还图书处理
  const handleReturn = async (item) => {
    try {
      Alert.alert(
        'Return Book',
        'Are you sure you want to return this book?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Confirm',
            onPress: async () => {
              const userInfo = await AsyncStorage.getItem('userInfo');
              if (!userInfo) return;

              const user = JSON.parse(userInfo);
              const now = new Date().toISOString();
              const response = await bookApi.borrowBook({
                bookId: item.bookId,
                bookState: "0",
                userName: user.userName,
                borrowId: item.id,
                returnTime: now
              });

              console.log('Return response:', response);

              if (response.code === 0) {
                Alert.alert('Success', 'Book returned successfully', [
                  {
                    text: 'OK',
                    onPress: () => {
                      loadBorrowList();
                      navigation.getParent()?.setParams({ refresh: Date.now() });
                    }
                  }
                ]);
              } else {
                Alert.alert('Failed', response.msg || 'Failed to return book. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Return book error:', error);
      Alert.alert('Error', 'Failed to return book. Please try again later.');
    }
  };
// 格式化日期时间
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };
// 计算应还时间
  const calculateDueDate = (borrowDate) => {
    if (!borrowDate) return 'Unknown';
    const date = new Date(borrowDate);
    date.setDate(date.getDate() + 30);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };
// 渲染图书项
  const renderItem = ({ item }) => {
    return (
      <View style={styles.bookItem}>
        <Image
          source={{
//            uri: item.booksImg?.replace('localhost', '192.168.31.203') || null
            uri: item.booksImg?.replace('localhost', '192.168.43.166') || null
          }}
          style={styles.bookImage}
          defaultSource={require('../assets/tushu1.jpg')}
        />
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle}>{item.bookName}</Text>
          <Text style={styles.bookAuthor}>Author: {item.supplier}</Text>
          <Text style={styles.dateInfo}>
            Borrow Date: {formatDateTime(item.createTime)}
          </Text>
          <Text style={styles.dateInfo}>
            Due Date: {calculateDueDate(item.createTime)}
          </Text>
          <TouchableOpacity
            style={styles.returnButton}
            onPress={() => handleReturn(item)}
          >
            <Text style={styles.returnButtonText}>Return</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Current Borrowed ({borrowedBooks.length})</Text>
      </View>
      <FlatList
        data={borrowedBooks}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="book" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No borrowed books</Text>
          </View>
        )}
      />
    </View>
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
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  listContainer: {
    padding: 15,
  },
  bookItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookImage: {
    width: 80,
    height: 120,
    borderRadius: 4,
    marginRight: 15,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dateInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
  },
  returnButton: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  returnButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default BorrowInfoScreen; 