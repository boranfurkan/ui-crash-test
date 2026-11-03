import React, { useEffect, useState, useContext } from 'react';
import { createRoot } from 'react-dom/client';
// @ts-expect-error Router v5 is retained for compatibility with the unchanged upstream header.
import { BrowserRouter } from 'react-router-dom';
// @ts-expect-error Unmodified upstream JavaScript.
import Header from './vendor/react-shopping-cart/src/components/Header.jsx';
// @ts-expect-error Unmodified upstream JavaScript.
import CartProvider, { CartStateContext, CartDispatchContext, addToCart } from './vendor/react-shopping-cart/src/contexts/cart.jsx';
// @ts-expect-error Unmodified upstream JavaScript.
import CommonProvider from './vendor/react-shopping-cart/src/contexts/common.jsx';
import type { CartInput } from '../../scenarios/cart-preview.ts';
import './cart.scss';

function Fixture({ input }: { input: CartInput }) {
  const dispatch = useContext(CartDispatchContext);
  const state = useContext(CartStateContext) as { items: CartInput['products'] };
  const [assetsReady, setAssetsReady] = useState(false);
  useEffect(() => { for (const item of input.products) addToCart(dispatch, item); }, [input, dispatch]);
  const stateReady = JSON.stringify(state.items) === JSON.stringify(input.products);
  useEffect(() => { if (stateReady) void Promise.all(Array.from(document.images, image => image.decode())).then(() => setAssetsReady(true)).catch(() => setAssetsReady(false)); }, [stateReady]);
  const ready = stateReady && assetsReady;
  return <><Header/><main className="cart-fixture-note" data-ready={ready} data-input={JSON.stringify({ ...input, products: state.items })}>
    <h1>Shopping app · original header and cart preview</h1><p>Open the cart in the header. The implementation, providers and cart styles are copied unchanged from the pinned upstream revision.</p><p>This local harness supplies synthetic cart data. The checkout control only navigates locally; no purchase service is connected.</p>
  </main></>;
}
function App() {
  const [input, setInput] = useState<CartInput | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { void fetch('/api/cart-fixture').then(response => { if (!response.ok) throw new Error('Fixture request failed'); return response.json(); }).then(setInput).catch(error => setError(String(error))); }, []);
  if (error) return <p role="alert">{error}</p>;
  if (!input) return <p>Loading cart fixture…</p>;
  return <BrowserRouter><CommonProvider><CartProvider><Fixture input={input}/></CartProvider></CommonProvider></BrowserRouter>;
}
createRoot(document.getElementById('root')!).render(<App/>);
