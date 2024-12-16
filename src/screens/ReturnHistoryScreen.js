// 导入必要的依赖
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { bookApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ReturnHistoryScreen = () => {
  // 状态管理
  const [returnHistory, setReturnHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 加载归还历史
  const loadReturnHistory = async () => {
    try {
      setLoading(true);
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (!userInfo) return;

      const user = JSON.parse(userInfo);
      const response = await bookApi.getBorrowList({
        pageNum: 1,
        pageSize: 50,
        userName: user.userName,
        bookName: '',
        supplier: '',
        bookState: '0'  // 0表示已归还
      });

      if (response.code === 0) {
        const historyList = response.data.data.list || [];
        setReturnHistory(historyList);
      }
    } catch (error) {
      console.error('加载归还历史失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadReturnHistory();
  }, []);

  // 下拉刷新处理
  const handleRefresh = () => {
    setRefreshing(true);
    loadReturnHistory();
  };

  // 格式化日期时间
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('日期格式化失败:', error);
      return 'Unknown';
    }
  };

  // 渲染历史记录项
  const renderItem = ({ item }) => (
    <View style={styles.historyItem}>
      <Image
//        source={{ uri: item.booksImg?.replace('localhost', '192.168.31.203') }}
        source={{ uri: item.booksImg?.replace('localhost', '192.168.43.166') }}
        style={styles.bookImage}
        defaultSource={require('../assets/tushu1.jpg')}
      />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{item.bookName}</Text>
        <Text style={styles.bookAuthor}>Author: {item.supplier}</Text>
        <Text style={styles.dateInfo}>Borrow Date: {formatDate(item.createTime)}</Text>
        <Text style={styles.dateInfo}>Return Date: {formatDate(item.returnTime)}</Text>
        <View style={styles.statusTag}>
          <Text style={styles.statusText}>Returned</Text>
        </View>
      </View>
    </View>
  );

  // 加载状态显示
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={returnHistory}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="history" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No return history</Text>
          </View>
        )}
      />
    </View>
  );
};

// 样式定义
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
  listContainer: {
    padding: 15,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
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
    color: '#999',
    marginBottom: 2,
  },
  statusTag: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusText: {
    color: '#4caf50',
    fontSize: 12,
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
});

export default ReturnHistoryScreen;