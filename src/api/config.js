const config = {
    api: {
      local: import.meta.env.VITE_PRODUCT_CSO_API_LOCAL || 'http://localhost:3000',
      remote: import.meta.env.VITE_PRODUCT_CSO_API_REMOTE || 'http://localhost:3000',
    },
  };
  
  export default config;