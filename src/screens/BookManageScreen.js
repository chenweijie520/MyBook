import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  Image,
  TouchableWithoutFeedback
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { bookApi } from '../services/api';
import { launchImageLibrary } from 'react-native-image-picker';

const BookManageScreen = () => {
  const [books, setBooks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [searchAuthor, setSearchAuthor] = useState('');
  const pageSize = 10;
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [newBook, setNewBook] = useState({
    bookName: '',
    supplier: '',
    createTime: '',
    stock: '',
    describe: '',
    typeId: '1',
    recommend: false,
    firstImg: '',
    booksImg: ''
  });

  const loadBooks = async (pageNum = 1) => {
    try {
      const response = await bookApi.getBookList({
        pageNum,
        pageSize,
        bookName: searchText,
        typeId: '',
        supplier: searchAuthor
      });

      if (response.code === 0 && response.data && response.data.data) {
        const newBooks = response.data.data.list || [];
        const sortedBooks = newBooks.sort((a, b) => parseInt(a.id) - parseInt(b.id));

        if (sortedBooks.length > 0) {
          setBooks(pageNum === 1 ? sortedBooks : [...books, ...sortedBooks]);
          setHasMore(!response.data.data.isLastPage);
        } else {
          setBooks([]);
          setHasMore(false);
        }
      } else {
        console.error('获取图书列表失败:', response);
        Alert.alert('Error', response.msg || 'Failed to get book list');
      }
    } catch (error) {
      console.error('加载图书列表失败:', error);
      Alert.alert('Error', 'Failed to load books');
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setRefreshing(true);
      await loadBooks(1);
      setRefreshing(false);
    };

    initializeData();
  }, [searchText, searchAuthor]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadBooks(1);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadBooks(nextPage);
    }
  };

  const handleSearch = () => {
    setPage(1);
  };

  const handleDeleteBook = (bookId) => {
    Alert.alert(
      'Delete Book',
      'Are you sure you want to delete this book?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const response = await bookApi.deleteBook(bookId);
              if (response.code === 0) {
                setPage(1);
                setRefreshing(true);
                try {
                  await loadBooks(1);
                } finally {
                  setRefreshing(false);
                }
                Alert.alert('Success', 'Book deleted successfully');
              } else {
                Alert.alert('Error', response.msg || 'Failed to delete book');
              }
            } catch (error) {
              console.error('删除图书失败:', error);
              Alert.alert('Error', 'Failed to delete book');
            }
          }
        }
      ]
    );
  };

  const handleEditBook = async (book) => {
    try {
      const response = await bookApi.getBookDetail(book.id);

      if (response.code === 0 && response.data) {
        const bookData = response.data;
        setEditingBook({
          ...bookData,
          createTime: bookData.createTime?.split(' ')[0] || '',
          stock: bookData.stock?.toString() || '0',
          describe: bookData.describe || '',
//          firstImg: bookData.firstImg?.replace('localhost', '192.168.31.203') || '',
          firstImg: bookData.firstImg?.replace('localhost', '192.168.43.166') || '',
          id: bookData.id,
          typeId: bookData.typeId || '1'
        });
        setEditModalVisible(true);
      } else {
        Alert.alert('Error', response.msg || 'Failed to get book details');
      }
    } catch (error) {
      console.error('加载图书详情失败:', error);
      Alert.alert('Error', 'Failed to load book details');
    }
  };

  const handleAddBook = async () => {
    try {
      if (!newBook.bookName || !newBook.supplier || !newBook.createTime || !newBook.stock) {
        Alert.alert('Notice', 'Please fill in all required fields');
        return;
      }

      const bookData = {
        ...newBook,
        stock: parseInt(newBook.stock),
        message: newBook.describe || '',
        recommend: false,
        booksShow: true
      };

      const response = await bookApi.insertBook(bookData);

      if (response.code === 0) {
        setModalVisible(false);
        setNewBook({
          bookName: '',
          supplier: '',
          createTime: '',
          stock: '',
          describe: '',
          typeId: '1',
          recommend: false,
          firstImg: '',
          booksImg: ''
        });

        setPage(1);
        setRefreshing(true);
        try {
          await loadBooks(1);
        } finally {
          setRefreshing(false);
        }

        Alert.alert('Success', 'Book added successfully');
      } else {
        Alert.alert('Error', response.msg || 'Failed to add book');
      }
    } catch (error) {
      console.error('添加图书失败:', error);
      Alert.alert('Error', 'Failed to add book');
    }
  };

  const handleUpdateBook = async () => {
    try {
      if (!editingBook.bookName || !editingBook.supplier || !editingBook.createTime || !editingBook.stock) {
        Alert.alert('Notice', 'Please fill in all required fields');
        return;
      }

      const updateData = {
        ...editingBook,
        stock: parseInt(editingBook.stock),
        describe: editingBook.describe || ''
      };

      const response = await bookApi.updateBook(updateData);

      if (response.code === 0) {
        setEditModalVisible(false);
        setEditingBook(null);

        setPage(1);
        setRefreshing(true);
        try {
          await loadBooks(1);
        } finally {
          setRefreshing(false);
        }

        Alert.alert('Success', 'Book updated successfully');
      } else {
        Alert.alert('Error', response.msg || 'Failed to update book');
      }
    } catch (error) {
      console.error('更新图书失败:', error);
      Alert.alert('Error', 'Failed to update book');
    }
  };

  const handleSelectImage = async (type = 'cover') => {
    try {
      const options = {
        mediaType: 'photo',
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.8,
      };

      const result = await launchImageLibrary(options);
      if (!result.didCancel && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];

        const formData = new FormData();
        formData.append('file', {
          uri: Platform.OS === 'ios'
            ? selectedImage.uri.replace('file://', '')
            : selectedImage.uri,
          type: 'image/jpeg',
          name: 'cover.jpg',
        });

        try {
          const uploadResponse = await bookApi.uploadImage(formData);
          if (uploadResponse.code === 0) {
            const imageUrl = uploadResponse.data;

            if (type === 'cover') {
              if (editingBook) {
                setEditingBook({
                  ...editingBook,
                  firstImg: imageUrl
                });
              } else {
                setNewBook({
                  ...newBook,
                  firstImg: imageUrl
                });
              }
            } else {
              if (editingBook) {
                setEditingBook({
                  ...editingBook,
                  booksImg: imageUrl
                });
              } else {
                setNewBook({
                  ...newBook,
                  booksImg: imageUrl
                });
              }
            }
          } else {
            Alert.alert('Failed', 'Image upload failed');
          }
        } catch (error) {
          console.error('上传图片失败:', error);
          Alert.alert('Error', 'Failed to upload image');
        }
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleUpdateBookStatus = async (bookId, currentStatus) => {
    try {
      const response = await bookApi.updateShow(bookId, !currentStatus);
      if (response.code === 0) {
        Alert.alert('Success', 'Book status updated successfully');
        onRefresh();
      } else {
        Alert.alert('Error', response.msg || 'Failed to update book status');
      }
    } catch (error) {
      console.error('更新图书状态失败:', error);
      Alert.alert('Error', 'Failed to update book status');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.bookItem}>
      <View style={styles.bookHeader}>
        <View style={styles.bookImageContainer}>
          {item.firstImg ? (
            <Image
//              source={{ uri: item.firstImg.replace('localhost', '192.168.31.203') }}
              source={{ uri: item.firstImg.replace('localhost', '192.168.43.166') }}
              style={styles.bookCover}
              onError={(error) => {
                console.error('加载图片失败:', error);
              }}
            />
          ) : (
            <View style={styles.bookCover}>
              <Icon name="image-not-supported" size={30} color="#ccc" />
            </View>
          )}
        </View>
        <View style={styles.bookMainInfo}>
          <Text style={styles.bookName}>{item.bookName || 'Unknown'}</Text>
          <Text style={styles.bookDetail}>Author: {item.supplier || 'Unknown'}</Text>
          <Text style={styles.bookDetail}>Published: {item.createTime || 'Unknown'}</Text>
          <Text style={styles.bookDetail}>Stock: {item.stock || '0'}</Text>
          <Text style={[
            styles.bookDetail,
            { color: parseInt(item.stock) > 0 ? '#4CAF50' : '#ff6b6b' }
          ]}>
            {parseInt(item.stock) > 0 ? 'Available' : 'Unavailable'}
          </Text>
        </View>
      </View>

      <Text style={styles.bookDescription} numberOfLines={2}>
        Description: {item.describe || 'No description'}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => handleEditBook(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#f44336' }]}
          onPress={() => handleDeleteBook(item.id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search book name"
            value={searchText}
            onChangeText={setSearchText}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search author"
            value={searchAuthor}
            onChangeText={setSearchAuthor}
          />
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <Icon name="search" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>Add Book</Text>
      </TouchableOpacity>

      <FlatList
        data={books}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No books found</Text>
        }
      />

      {/* 添加图书模态框 */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Add New Book</Text>

              {/* 封面图片选择 */}
              <TouchableWithoutFeedback onPress={() => handleSelectImage('cover')}>
                <View style={styles.imageSelector}>
                  {newBook.firstImg ? (
                    <Image
//                      source={{ uri: newBook.firstImg.replace('localhost', '192.168.31.203') }}
                      source={{ uri: newBook.firstImg.replace('localhost', '192.168.43.166') }}
                      style={styles.selectedImage}
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Icon name="add-photo-alternate" size={40} color="#666" />
                      <Text style={styles.imagePlaceholderText}>Add Cover Image</Text>
                    </View>
                  )}
                </View>
              </TouchableWithoutFeedback>

              {/* 书名输入 */}
              <TextInput
                style={styles.modalInput}
                placeholder="Book Name"
                value={newBook.bookName}
                onChangeText={(text) => setNewBook({...newBook, bookName: text})}
              />

              {/* 作者输入 */}
              <TextInput
                style={styles.modalInput}
                placeholder="Author"
                value={newBook.supplier}
                onChangeText={(text) => setNewBook({...newBook, supplier: text})}
              />

              {/* 出版日期输入 */}
              <TextInput
                style={styles.modalInput}
                placeholder="Publication Date (YYYY-MM-DD)"
                value={newBook.createTime}
                onChangeText={(text) => setNewBook({...newBook, createTime: text})}
              />

              {/* 库存输入 */}
              <TextInput
                style={styles.modalInput}
                placeholder="Stock"
                value={newBook.stock}
                onChangeText={(text) => setNewBook({...newBook, stock: text})}
                keyboardType="numeric"
              />

              {/* 描述输入 */}
              <TextInput
                style={[styles.modalInput, { height: 100 }]}
                placeholder="Description"
                value={newBook.describe}
                onChangeText={(text) => setNewBook({...newBook, describe: text})}
                multiline
              />

              {/* 按钮组 */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#ff6b6b' }]}
                  onPress={() => {
                    setModalVisible(false);
                    setNewBook({
                      bookName: '',
                      supplier: '',
                      createTime: '',
                      stock: '',
                      describe: '',
                      typeId: '1',
                      recommend: false,
                      firstImg: '',
                      booksImg: ''
                    });
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#51cf66' }]}
                  onPress={handleAddBook}
                >
                  <Text style={styles.modalButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 编辑图书模态框 */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Edit Book</Text>

              {/* 封面图片编辑 */}
              <TouchableWithoutFeedback onPress={() => handleSelectImage('cover')}>
                <View style={styles.imageSelector}>
                  {editingBook?.firstImg ? (
                    <Image
//                      source={{ uri: editingBook.firstImg.replace('localhost', '192.168.31.203') }}
                      source={{ uri: editingBook.firstImg.replace('localhost', '192.168.43.166') }}
                      style={styles.selectedImage}
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Icon name="add-photo-alternate" size={40} color="#666" />
                      <Text style={styles.imagePlaceholderText}>Add Cover Image</Text>
                    </View>
                  )}
                </View>
              </TouchableWithoutFeedback>

              {/* 书名编辑 */}
              <TextInput
                style={styles.modalInput}
                placeholder="Book Name"
                value={editingBook?.bookName}
                onChangeText={(text) => setEditingBook({...editingBook, bookName: text})}
              />

              {/* 作者编辑 */}
              <TextInput
                style={styles.modalInput}
                placeholder="Author"
                value={editingBook?.supplier}
                onChangeText={(text) => setEditingBook({...editingBook, supplier: text})}
              />

              {/* 出版日期编辑 */}
              <TextInput
                style={styles.modalInput}
                placeholder="Publication Date (YYYY-MM-DD)"
                value={editingBook?.createTime}
                onChangeText={(text) => setEditingBook({...editingBook, createTime: text})}
              />

              {/* 库存编辑 */}
              <TextInput
                style={styles.modalInput}
                placeholder="Stock"
                value={String(editingBook?.stock)}
                onChangeText={(text) => setEditingBook({...editingBook, stock: text})}
                keyboardType="numeric"
              />

              {/* 描述编辑 */}
              <TextInput
                style={[styles.modalInput, { height: 100 }]}
                placeholder="Description"
                value={editingBook?.describe}
                onChangeText={(text) => setEditingBook({...editingBook, describe: text})}
                multiline
              />

              {/* 按钮组 */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#ff6b6b' }]}
                  onPress={() => {
                    setEditModalVisible(false);
                    setEditingBook(null);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#51cf66' }]}
                  onPress={handleUpdateBook}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  searchButton: {
    backgroundColor: '#1a73e8',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  bookItem: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 6,
    marginHorizontal: 12,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  bookImageContainer: {
    width: 100,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  bookCover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bookMainInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'space-between',
  },
  bookName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  bookDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  borrowStatus: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  bookDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  modalInput: {
    height: 45,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  imageSelector: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#1a73e8',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    alignItems: 'center',
    margin: 10,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 16,
  },
});

export default BookManageScreen;