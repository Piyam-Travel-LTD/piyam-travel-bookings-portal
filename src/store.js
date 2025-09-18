import create from 'zustand';
import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";

const useStore = create((set, get) => ({
  customers: [],
  selectedCustomer: null,
  isLoading: true,
  
  // --- Actions ---

  // Fetches all customers from Firestore and initializes the store
  fetchCustomers: async () => {
    set({ isLoading: true });
    try {
      const customersCollection = collection(db, "customers");
      const customerSnapshot = await getDocs(customersCollection);
      const customerList = customerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      set({ customers: customerList, isLoading: false });
    } catch (error) {
      console.error("Error fetching customers: ", error);
      set({ isLoading: false });
    }
  },

  // Sets the currently selected customer
  setSelectedCustomer: (customer) => {
    set({ selectedCustomer: customer });
  },
  
  // Adds a new customer to Firestore and the local state
  addCustomer: (newCustomerData) => {
    const newCustomer = { id: newCustomerData.id, ...newCustomerData };
    set(state => ({
      customers: [newCustomer, ...state.customers],
      selectedCustomer: newCustomer
    }));
  },

  // Updates a customer in the local state
  updateCustomerState: (updatedCustomer) => {
    set(state => ({
      customers: state.customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c),
      selectedCustomer: updatedCustomer
    }));
  },
  
  // Deletes a customer from the local state
  deleteCustomerState: (customerId) => {
      set(state => ({
          customers: state.customers.filter(c => c.id !== customerId),
          selectedCustomer: null
      }));
  }
}));

export default useStore;
