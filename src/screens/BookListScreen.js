import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { bookApi } from '../services/api';

const BookListScreen = ({ navigation }) => {
  // 状态管理
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pageNum, setPageNum] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 加载图书列表
  const loadBooks = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await bookApi.getBookList({
        pageNum: page,
        pageSize: 10,
        bookName: search,
        typeId: '',
        supplier: '',
      });

      if (response.code === 0 && response.data && response.data.data) {
        const newBooks = response.data.data.list || [];

        // 处理图片路径
        const processedBooks = newBooks.map(book => ({
          ...book,
          firstImg: book.firstImg
//            ? book.firstImg.replace('localhost', '192.168.31.203')
            ? book.firstImg.replace('localhost', '192.168.43.166')
            : null
        }));

        if (page === 1) {
          setBooks(processedBooks);
        } else {
          setBooks(prev => [...prev, ...processedBooks]);
        }

        setHasMore(processedBooks.length === 10);
      } else {
        console.error('获取图书列表失败:', response);
      }
    } catch (error) {
      console.error('加载图书列表失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadBooks();
  }, []);

  // 下拉刷新处理
  const handleRefresh = () => {
    setRefreshing(true);
    setPageNum(1);
    loadBooks(1, searchText);
  };

  // 加载更多处理
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = pageNum + 1;
      setPageNum(nextPage);
      loadBooks(nextPage, searchText);
    }
  };

  // 搜索处理
  const handleSearch = () => {
    setPageNum(1);
    setBooks([]);
    loadBooks(1, searchText);
  };

  // 渲染图书项
  const renderBookItem = ({ item }) => (
    <TouchableOpacity
      style={styles.bookItem}
      onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}
    >
      <View style={styles.bookImage}>
        {item.firstImg ? (
          <Image
            source={{ uri: item.firstImg }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noImage}>
            <Icon name="image-not-supported" size={30} color="#999" />
          </View>
        )}
      </View>
      <View style={styles.bookInfo}>
        <Text style={styles.bookName}>{item.bookName}</Text>
        <Text style={styles.author}>Author: {item.supplier}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.describe ? item.describe.slice(0, 100) + '...' : 'No description'}
        </Text>
        <View style={styles.statusContainer}>
          <Text style={[
            styles.status,
            { color: parseInt(item.stock) > 0 ? '#4CAF50' : '#ff6b6b' }
          ]}>
            {parseInt(item.stock) > 0 ? 'Available' : 'Unavailable'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // 渲染加载更多指示器
  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#1a73e8" />
        <Text style={styles.footerText}>Loading...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search book name"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchText ? (
            <TouchableOpacity
              onPress={() => {
                setSearchText('');
                handleSearch();
              }}
              style={styles.clearButton}
            >
              <Icon name="close" size={20} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1a73e8']}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="library-books" size={60} color="#ccc" />
            <Text style={styles.emptyText}>
              {loading ? 'Loading...' : 'No books found'}
            </Text>
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
  searchBar: {
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    padding: 10,
  },
  bookItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
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
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    marginRight: 15,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  bookName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  status: {
    fontSize: 12,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  footerText: {
    marginLeft: 8,
    color: '#666',
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

export default BookListScreen; 