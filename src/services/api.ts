const RAW = import.meta.env.VITE_BACKEND_URL ?? '/api'; // passe par l'edge/proxy
const BACKEND_URL = RAW.replace(/\/$/, '');             // retire le / final

interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
  };
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  category: string;
}

interface CartItem {
  id: number;
  quantity: number;
  added_at: string;
  product_id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
}

let authToken: string | null = localStorage.getItem('authToken');

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

export function isAuthenticated(): boolean {
  return !!authToken;
}

function getAuthHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
}

export async function registerUser(email: string, password: string) {
  const response = await fetch(`${BACKEND_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }

  return response.json();
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  const data = await response.json();
  setAuthToken(data.token);
  return data;
}

export function logout() {
  setAuthToken(null);
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${BACKEND_URL}/products`);

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
}

export async function fetchProduct(id: number): Promise<Product> {
  const response = await fetch(`${BACKEND_URL}/products/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch product');
  }

  return response.json();
}

export async function fetchCart(): Promise<CartItem[]> {
  const response = await fetch(`${BACKEND_URL}/cart`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch cart');
  }

  return response.json();
}

export async function addToCart(productId: number, quantity: number = 1) {
  const response = await fetch(`${BACKEND_URL}/cart/add`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ productId, quantity }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add to cart');
  }

  return response.json();
}

export async function updateCartItem(id: number, quantity: number) {
  const response = await fetch(`${BACKEND_URL}/cart/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ quantity }),
  });

  if (!response.ok) {
    throw new Error('Failed to update cart');
  }

  return response.json();
}

export async function removeFromCart(id: number) {
  const response = await fetch(`${BACKEND_URL}/cart/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to remove item');
  }

  return response.json();
}

export async function clearCart() {
  const response = await fetch(`${BACKEND_URL}/cart`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to clear cart');
  }

  return response.json();
}
