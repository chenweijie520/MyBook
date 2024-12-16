import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { bookApi } from '../services/api';

const { width: screenWidth } = Dimensions.get('window');
// 图书分类数据
const categories = [
  { name: 'Literature', icon: 'menu-book', id: '1' },
  { name: 'Science', icon: 'science', id: '2' },
  { name: 'History', icon: 'history-edu', id: '3' },
  { name: 'Art', icon: 'palette', id: '4' }
];

const HomeScreen = ({ navigation }) => {
  const scrollViewRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [recommendedBooks, setRecommendedBooks] = useState([]);

  // 轮播图数据
  const bannerImages = [
    require('../assets/1.jpg'),
    require('../assets/2.jpg'),
    require('../assets/3.jpg'),
  ];

  // 自动轮播
  useEffect(() => {
    const timer = setInterval(() => {
      const nextPage = (currentPage + 1) % bannerImages.length;
      scrollViewRef.current?.scrollTo({
        x: nextPage * screenWidth,
        animated: true,
      });
      setCurrentPage(nextPage);
    }, 3000);

    return () => clearInterval(timer);
  }, [currentPage]);

  // 处理滚动结束事件
  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / screenWidth);
    setCurrentPage(page);
  };

  // 修改加载推荐图书的函数
  const loadRecommendedBooks = async () => {
    try {
      const response = await bookApi.getBookList({
        pageNum: 1,
        pageSize: 5,
        bookName: '',
        typeId: '',
        supplier: '',
      });

      console.log('API Response:', response);

      if (response.code === 0 && response.data?.data?.list) {
        const processedBooks = response.data.data.list.map(book => ({
          id: book.id,
          bookName: book.bookName,
          supplier: book.supplier,
          booksImg: book.firstImg
//            ? book.firstImg.replace('localhost', '192.168.31.203')
            ? book.firstImg.replace('localhost', '192.168.43.166')
            : null,
          description: book.describe,
          stock: book.stock
        }));

        console.log('Processed books:', processedBooks);
        setRecommendedBooks(processedBooks);
      }
    } catch (error) {
      console.error('加载推荐图书失败:', error);
    }
  };

  // 在组件加载时获取推荐图书
  useEffect(() => {
    loadRecommendedBooks();
  }, []);

  // 添加搜索处理函数
  const handleSearch = () => {
    if (searchText.trim()) {
      navigation.navigate('SearchResults', { keyword: searchText });
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.searchBar}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={24} color="#999" />
          <TextInput
            placeholder="Search books and authors"
            style={styles.searchInput}
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchText ? (
            <TouchableOpacity
              onPress={() => setSearchText('')}
              style={styles.clearButton}
            >
              <Icon name="close" size={20} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* 轮播图部分 */}
      <View style={styles.bannerContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
        >
          {bannerImages.map((image, index) => (
            <Image
              key={index}
              source={image}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
        {/* 指示器 */}
        <View style={styles.pagination}>
          {bannerImages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                currentPage === index && styles.paginationDotActive
              ]}
            />
          ))}
        </View>
      </View>
{/* 图书分类 */}
      <View style={styles.categories}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categoryGrid}>
          {categories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={styles.categoryItem}
              onPress={() => navigation.navigate('SearchResults', {
                id: category.id,
                title: category.name
              })}
            >
              <View style={styles.categoryIcon}>
                <Icon name={category.icon} size={24} color="#1a73e8" />
              </View>
              <Text style={styles.categoryText}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 推荐图书部分 */}
      <View style={styles.recommendedBooks}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended</Text>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => navigation.navigate('BooksTab')}
          >
            <Text style={styles.moreText}>More</Text>
            <Icon name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {recommendedBooks.map(book => (
            <TouchableOpacity
              key={book.id}
              style={styles.bookCard}
              onPress={() => navigation.navigate('BookDetail', {
                bookId: book.typeId || book.id,
                bookName: book.bookName,
                author: book.supplier,
                imageUrl: book.booksImg,
                description: book.describe
              })}
            >
              <View style={styles.bookImageContainer}>
                <Image
                  source={
                    book.booksImg
                      ? { uri: book.booksImg }
                      : require('../assets/tushu1.jpg')
                  }
                  style={styles.bookImage}
                  resizeMode="cover"
                  defaultSource={require('../assets/tushu1.jpg')}
                  onError={(error) => {
                    console.error('Image loading error:', error);
                  }}
                />
              </View>
              <Text style={styles.bookTitle} numberOfLines={1}>
                {book.bookName || 'Unknown Title'}
              </Text>
              <Text style={styles.bookAuthor} numberOfLines={1}>
                {book.supplier || 'Unknown Author'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchBar: {
    padding: 15,
    backgroundColor: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    height: '100%',
    padding: 0,
  },
  bannerContainer: {
    height: 200,
    position: 'relative',
  },
  bannerImage: {
    width: screenWidth,
    height: 200,
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#fff',
  },
  recommendedBooks: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 14,
    color: '#666',
  },
  horizontalList: {
    paddingLeft: 15,
    paddingRight: 5,
  },
  bookCard: {
    width: 120,
    marginRight: 15,
  },
  bookImageContainer: {
    width: 120,
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookImage: {
    width: '100%',
    height: '100%',
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#666',
  },
  categories: {
    backgroundColor: '#fff',
    padding: 15,
    marginTop: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingHorizontal: 10,
  },
  categoryItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f7ff',
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  clearButton: {
    padding: 4,
  },
});

export default HomeScreen;