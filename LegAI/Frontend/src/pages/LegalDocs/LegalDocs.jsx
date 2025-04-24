import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Tab } from '@headlessui/react';
import { FaPlus, FaSync } from 'react-icons/fa';
import styles from './LegalDocs.module.css';

// Import components
import DocCard from './components/DocCard';
import DocSearchFilter from './components/DocSearchFilter';
import DocUploadModal from './components/DocUploadModal';
import legalDocService from '../../services/legalDocService';

// Import từ context hoặc auth service
import { useAuth } from '../../contexts/AuthContext';

const LegalDocs = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState(0);
  const [docs, setDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12
  });
  
  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  
  // Tabs
  const tabs = [
    { id: 'all', label: t('legal.tabs.all') },
    { id: 'my', label: t('legal.tabs.myDocs') },
    { id: 'shared', label: t('legal.tabs.shared') },
    { id: 'analyzed', label: t('legal.tabs.analyzed') }
  ];
  
  // Load documents
  useEffect(() => {
    fetchDocuments();
    fetchCategories();
  }, [activeTab, filters, pagination.currentPage]);
  
  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      // Prepare query params
      const params = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        search: filters.search,
        category: filters.category,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };
      
      // Add tab specific filter
      if (activeTab === 1) {
        params.owner = user.id;
      } else if (activeTab === 2) {
        params.sharedWithMe = true;
      } else if (activeTab === 3) {
        params.analyzed = true;
      }
      
      const response = await legalDocService.getLegalDocs(params);
      setDocs(response.data);
      setPagination({
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalItems: response.totalItems,
        itemsPerPage: response.itemsPerPage
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error(t('legal.errors.fetchFailed'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await legalDocService.getCategories();
      setCategories(response);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };
  
  // Handle actions
  const handleTabChange = (index) => {
    setActiveTab(index);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };
  
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };
  
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };
  
  const handleRefresh = () => {
    fetchDocuments();
  };
  
  // Document actions
  const handleViewDoc = (docId) => {
    // Navigate to document viewer
    console.log('View document:', docId);
  };
  
  const handleDownloadDoc = async (docId) => {
    try {
      await legalDocService.downloadLegalDoc(docId);
      toast.success(t('legal.success.download'));
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error(t('legal.errors.downloadFailed'));
    }
  };
  
  const handleShareDoc = (docId) => {
    // Open share modal
    console.log('Share document:', docId);
  };
  
  const handleDeleteDoc = async (docId) => {
    if (window.confirm(t('legal.confirmations.delete'))) {
      try {
        await legalDocService.deleteLegalDoc(docId);
        toast.success(t('legal.success.delete'));
        fetchDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error(t('legal.errors.deleteFailed'));
      }
    }
  };
  
  const handleAnalyzeDoc = async (docId) => {
    try {
      await legalDocService.analyzeLegalDoc(docId);
      toast.success(t('legal.success.analyzeStarted'));
      fetchDocuments();
    } catch (error) {
      console.error('Error analyzing document:', error);
      toast.error(t('legal.errors.analyzeFailed'));
    }
  };
  
  // Upload handlers
  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    fetchDocuments();
    toast.success(t('legal.success.upload'));
  };
  
  // Render page numbers
  const renderPaginationItems = () => {
    const items = [];
    const { currentPage, totalPages } = pagination;
    
    // First page
    items.push(
      <button 
        key="first" 
        onClick={() => handlePageChange(1)} 
        disabled={currentPage === 1}
        className={styles.pageButton}
      >
        &laquo;
      </button>
    );
    
    // Previous page
    items.push(
      <button 
        key="prev" 
        onClick={() => handlePageChange(currentPage - 1)} 
        disabled={currentPage === 1}
        className={styles.pageButton}
      >
        &lsaquo;
      </button>
    );
    
    // Page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <button 
          key={i} 
          onClick={() => handlePageChange(i)} 
          className={`${styles.pageButton} ${currentPage === i ? styles.activePage : ''}`}
        >
          {i}
        </button>
      );
    }
    
    // Next page
    items.push(
      <button 
        key="next" 
        onClick={() => handlePageChange(currentPage + 1)} 
        disabled={currentPage === totalPages}
        className={styles.pageButton}
      >
        &rsaquo;
      </button>
    );
    
    // Last page
    items.push(
      <button 
        key="last" 
        onClick={() => handlePageChange(totalPages)} 
        disabled={currentPage === totalPages}
        className={styles.pageButton}
      >
        &raquo;
      </button>
    );
    
    return items;
  };
  
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>{t('legal.title')}</h1>
        <p>{t('legal.description')}</p>
      </div>
      
      {/* Tabs */}
      <div className={styles.tabs}>
        <Tab.Group selectedIndex={activeTab} onChange={handleTabChange}>
          <Tab.List className={styles.tabList}>
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                className={({ selected }) =>
                  `${styles.tabButton} ${selected ? styles.activeTab : ''}`
                }
              >
                {tab.label}
              </Tab>
            ))}
          </Tab.List>
        </Tab.Group>
      </div>
      
      {/* Action Bar */}
      <div className={styles.actionBar}>
        {/* Search and Filter */}
        <DocSearchFilter
          filters={filters}
          categories={categories}
          onFilterChange={handleFilterChange}
        />
        
        {/* Upload Button */}
        <div className={styles.actionButtons}>
          <button 
            className={styles.refreshButton} 
            onClick={handleRefresh}
            title={t('common.refresh')}
          >
            <FaSync />
          </button>
          <button 
            className={styles.uploadButton} 
            onClick={() => setShowUploadModal(true)}
          >
            <FaPlus />
            {t('legal.actions.upload')}
          </button>
        </div>
      </div>
      
      {/* Documents Grid */}
      {isLoading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>{t('common.loading')}</p>
        </div>
      ) : docs.length > 0 ? (
        <div className={styles.docsGrid}>
          {docs.map(doc => (
            <DocCard
              key={doc.id}
              doc={doc}
              isOwner={doc.owner.id === user.id}
              onView={() => handleViewDoc(doc.id)}
              onDownload={() => handleDownloadDoc(doc.id)}
              onShare={() => handleShareDoc(doc.id)}
              onDelete={() => handleDeleteDoc(doc.id)}
              onAnalyze={() => handleAnalyzeDoc(doc.id)}
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <i className="far fa-file-alt"></i>
          <h3>{t('legal.emptyState.title')}</h3>
          <p>{t('legal.emptyState.message')}</p>
          <button 
            className={styles.uploadButton} 
            onClick={() => setShowUploadModal(true)}
          >
            <FaPlus />
            {t('legal.actions.upload')}
          </button>
        </div>
      )}
      
      {/* Pagination */}
      {docs.length > 0 && (
        <div className={styles.pagination}>
          <div className={styles.pageInfo}>
            {t('common.pagination.showing', {
              from: ((pagination.currentPage - 1) * pagination.itemsPerPage) + 1,
              to: Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems),
              total: pagination.totalItems
            })}
          </div>
          <div className={styles.pageButtons}>
            {renderPaginationItems()}
          </div>
        </div>
      )}
      
      {/* Upload Modal */}
      {showUploadModal && (
        <DocUploadModal
          categories={categories}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
};

export default LegalDocs; 