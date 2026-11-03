import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Theme, Button, Dialog, Flex, Table, Text } from '@radix-ui/themes';
import productImage from './product.svg';
// @ts-expect-error Unmodified JavaScript source is deliberately kept outside the TS project.
import Product from './vendor/react-shopping-cart/src/components/Product.jsx';
// @ts-expect-error Unmodified upstream context; Vite resolves its original aliases.
import CartProvider from './vendor/react-shopping-cart/src/contexts/cart.jsx';

const params = new URLSearchParams(location.search);
const component = params.get('component') ?? 'product';
if (component === 'product') await import('./product.scss');
else await import('@radix-ui/themes/styles.css');

type Fixture = { title: string; description: string; price: number; rows: { id: string; name: string; email: string }[] };

function App() {
  const [data, setData] = useState<Fixture | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { void fetch(`/api/compat-fixture?component=${component}`).then(response => { if (!response.ok) throw new Error('Fixture request failed'); return response.json(); }).then(setData).catch(error => setError(String(error))); }, []);
  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p>Loading fixture…</p>;
  const style = { margin: '32px auto', padding: 16, maxWidth: 720 };
  const header = <header><h1 style={{ fontSize: 22 }}>External component fixture</h1><p>{component === 'product' ? 'sivadass/react-shopping-cart · pinned unchanged source' : '@radix-ui/themes 3.3.0 · library components in a local harness'}</p></header>;
  const product = { id: 1, name: data.title, price: data.price, stock: 10, image: productImage };
  return <Theme accentColor="green"><main className="fixture-shell" style={style} data-ready="true" data-input={JSON.stringify(data)}>
    {header}
    {component === 'product' && <CartProvider><Product data={product}/></CartProvider>}
    {component === 'dialog' && <Dialog.Root><Dialog.Trigger><Button data-open-dialog>Review details</Button></Dialog.Trigger><Dialog.Content maxWidth="450px" aria-describedby="dialog-description">
      <Dialog.Title data-dialog-title>{data.title}</Dialog.Title>
      <Dialog.Description id="dialog-description" size="2">{data.description}</Dialog.Description>
      <Flex gap="3" mt="4" justify="end"><Dialog.Close><Button data-dialog-close>Close details</Button></Dialog.Close></Flex>
    </Dialog.Content></Dialog.Root>}
    {component === 'table' && <Table.Root variant="surface"><Table.Header><Table.Row><Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell><Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell><Table.ColumnHeaderCell>Action</Table.ColumnHeaderCell></Table.Row></Table.Header><Table.Body>
      {data.rows.map(row => <Table.Row key={row.id} data-record={row.id}><Table.RowHeaderCell><Text data-record-name>{row.name}</Text></Table.RowHeaderCell><Table.Cell>{row.email}</Table.Cell><Table.Cell><Button size="1" data-row-action onClick={() => {}}>Review</Button></Table.Cell></Table.Row>)}
    </Table.Body></Table.Root>}
  </main></Theme>;
}

createRoot(document.getElementById('root')!).render(<App/>);
