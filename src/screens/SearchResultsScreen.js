import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { bookApi } from '../services/api';

const SearchResultsScreen = ({ route, navigation }) => {
  // 状态管理
  const { keyword, id, title } = route.params;
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // 设置页面标题
  useEffect(() => {
    if (title) {
      navigation.setOptions({ title: `${title} Category` });
    }
  }, [title]);

  // 根据参数加载数据
  useEffect(() => {
    if (id) {
      searchByCategory();
    } else if (keyword) {
      searchByKeyword();
    }
  }, [id, keyword]);

  // 按分类搜索
  const searchByCategory = async () => {
    try {
      setLoading(true);
      const response = await bookApi.getBookList({
        pageNum: 1,
        pageSize: 50,
        bookName: '',
        typeId: id,
        supplier: '',
      });

      if (response.code === 0 && response.data?.data?.list) {
        const processedBooks = response.data.data.list.map(book => ({
          id: book.id,
          bookName: book.bookName,
          supplier: book.supplier,
          describe: book.describe,
          stock: book.stock,
          firstImg: book.firstImg
//            ? book.firstImg.replace('localhost', '192.168.31.203')
            ? book.firstImg.replace('localhost', '192.168.43.166')
            : null
        }));
        setBooks(processedBooks);
      }
    } catch (error) {
      console.error('分类搜索失败:', error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  // 按关键词搜索
  const searchByKeyword = async () => {
    try {
      setLoading(true);
      const [bookNameResponse, authorResponse] = await Promise.all([
        bookApi.getBookList({
          pageNum: 1,
          pageSize: 50,
          bookName: keyword,
          typeId: '',
          supplier: '',
        }),
        bookApi.getBookList({
          pageNum: 1,
          pageSize: 50,
          bookName: '',
          typeId: '',
          supplier: keyword,
        })
      ]);

      let allBooks = [];

      if (bookNameResponse.code === 0 && bookNameResponse.data?.data?.list) {
        allBooks = [...bookNameResponse.data.data.list];
      }

      if (authorResponse.code === 0 && authorResponse.data?.data?.list) {
        const authorBooks = authorResponse.data.data.list;
        authorBooks.forEach(authorBook => {
          if (!allBooks.find(book => book.id === authorBook.id)) {
            allBooks.push(authorBook);
          }
        });
      }

      const processedBooks = allBooks.map(book => ({
        id: book.id,
        bookName: book.bookName,
        supplier: book.supplier,
        describe: book.describe,
        stock: book.stock,
        firstImg: book.firstImg
//          ? book.firstImg.replace('localhost', '192.168.31.203')
          ? book.firstImg.replace('localhost', '192.168.43.166')
          : null
      }));

      setBooks(processedBooks);
    } catch (error) {
      console.error('关键词搜索失败:', error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  // 渲染图书项
  const renderBookItem = ({ item }) => (
    <TouchableOpacity
      style={styles.bookItem}
      onPress={() => navigation.navigate('BookDetail', {
        bookId: item.id
      })}
    >
      <Image
        source={
          item.firstImg
            ? { uri: item.firstImg }
            : require('../assets/tushu1.jpg')
        }
        style={styles.bookImage}
        defaultSource={require('../assets/tushu1.jpg')}
      />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{item.bookName}</Text>
        <Text style={styles.bookAuthor}>Author: {item.supplier}</Text>
        <Text style={styles.bookDescription} numberOfLines={2}>
          {item.describe || 'No description'}
        </Text>
        <Text style={[
          styles.bookStatus,
          { color: item.stock > 0 ? '#4CAF50' : '#FF9800' }
        ]}>
          {item.stock > 0 ? 'Available' : 'Unavailable'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // 加载状态显示
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No books found
            </Text>
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
  bookItem: {
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
  bookDescription: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  bookStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});

export default SearchResultsScreen;