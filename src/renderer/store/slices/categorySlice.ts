import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Category Interface
 */
export interface Category {
  id: number;
  category_name: string;
  category_code: string;
  parent_category_id: number | null;
  description: string | null;
  hsn_code: string | null;
  tax_percentage: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Category Tree Node Interface
 */
export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
  level: number;
  path: string;
}

/**
 * Category Breadcrumb Interface
 */
export interface CategoryBreadcrumb {
  id: number;
  name: string;
  code: string;
}

/**
 * Category State Interface
 */
export interface CategoryState {
  categories: Category[];
  categoryTree: CategoryTreeNode[];
  rootCategories: Category[];
  currentCategory: Category | null;
  currentBreadcrumb: CategoryBreadcrumb[];
  loading: boolean;
  error: string | null;
}

/**
 * Initial State
 */
const initialState: CategoryState = {
  categories: [],
  categoryTree: [],
  rootCategories: [],
  currentCategory: null,
  currentBreadcrumb: [],
  loading: false,
  error: null,
};

/**
 * Category Slice
 */
const categorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Set categories list
    setCategories: (state, action: PayloadAction<Category[]>) => {
      state.categories = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Set category tree
    setCategoryTree: (state, action: PayloadAction<CategoryTreeNode[]>) => {
      state.categoryTree = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Set root categories
    setRootCategories: (state, action: PayloadAction<Category[]>) => {
      state.rootCategories = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Set current category
    setCurrentCategory: (state, action: PayloadAction<Category | null>) => {
      state.currentCategory = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Set breadcrumb
    setBreadcrumb: (state, action: PayloadAction<CategoryBreadcrumb[]>) => {
      state.currentBreadcrumb = action.payload;
    },

    // Add new category to list
    addCategory: (state, action: PayloadAction<Category>) => {
      state.categories.push(action.payload);
      // If it's a root category, add to rootCategories
      if (!action.payload.parent_category_id) {
        state.rootCategories.push(action.payload);
      }
    },

    // Update category in list
    updateCategory: (state, action: PayloadAction<Category>) => {
      const index = state.categories.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.categories[index] = action.payload;
      }

      const rootIndex = state.rootCategories.findIndex(c => c.id === action.payload.id);
      if (rootIndex !== -1) {
        state.rootCategories[rootIndex] = action.payload;
      }

      if (state.currentCategory?.id === action.payload.id) {
        state.currentCategory = action.payload;
      }
    },

    // Remove category from list
    removeCategory: (state, action: PayloadAction<number>) => {
      state.categories = state.categories.filter(c => c.id !== action.payload);
      state.rootCategories = state.rootCategories.filter(c => c.id !== action.payload);
      if (state.currentCategory?.id === action.payload) {
        state.currentCategory = null;
      }
    },

    // Clear all category data
    clearCategories: (state) => {
      state.categories = [];
      state.categoryTree = [];
      state.rootCategories = [];
      state.currentCategory = null;
      state.currentBreadcrumb = [];
      state.loading = false;
      state.error = null;
    },
  },
});

/**
 * Export actions
 */
export const {
  setLoading,
  setError,
  setCategories,
  setCategoryTree,
  setRootCategories,
  setCurrentCategory,
  setBreadcrumb,
  addCategory,
  updateCategory,
  removeCategory,
  clearCategories,
} = categorySlice.actions;

/**
 * Export reducer
 */
export default categorySlice.reducer;
