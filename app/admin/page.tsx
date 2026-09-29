'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Admin() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);

  // Manual entry state
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [manualName, setManualName] = useState('');

  // Product entry state
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('matcha');
  const [origin, setOrigin] = useState('');
  const [tasteNotes, setTasteNotes] = useState('');
  const [amazonUrl, setAmazonUrl] = useState('');

  async function search() {
    if (!process.env.NEXT_PUBLIC_GEOAPIFY_KEY) {
      console.error('GEOAPIFY_KEY is not set');
      return;
    }
    const res = await fetch(
      `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_KEY}`
    );
    const data = await res.json();
    setResults(data.features || []);
  }

  async function savePlace(feature: any) {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return;
    }
    const { data, error } = await supabase
      .from('places')
      .insert({
        name: feature.properties.name || feature.properties.address_line1,
        address: feature.properties.formatted,
        lat: feature.properties.lat,
        lng: feature.properties.lon,
        source: 'geoapify',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving place:', error);
    } else {
      setSelectedPlace(data);
    }
  }

  async function saveManualPlace() {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return;
    }
    const { data } = await supabase
      .from('places')
      .insert({
        name: manualName,
        lat: parseFloat(manualLat),
        lng: parseFloat(manualLng),
        source: 'manual',
      })
      .select()
      .single();

    setSelectedPlace(data);
  }

  async function saveProduct() {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return;
    }
    const { data: product, error } = await supabase
    .from('products')
    .insert({
      name: productName,
      category,
      origin,
      taste_notes: tasteNotes,
      amazon_url: amazonUrl || null,
    })
    .select()
    .single();

    if (error || !product) {
      console.error('Error saving product:', error, 'Product:', product);
      return;
    }

    if (selectedPlace) {
      await supabase.from('product_places').insert({
        product_id: product.id,
        place_id: selectedPlace.id,
      });
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a café..." />
      <button onClick={search}>Search</button>

      <ul>
        {results.map((f) => (
          <li key={f.properties.place_id} onClick={() => savePlace(f)}>
            {f.properties.formatted}
          </li>
        ))}
      </ul>

      {/* Manual entry form */}
      <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ddd' }}>
        <h3>Manual Place Entry</h3>

        <input
          value={manualName}
          onChange={(e) => setManualName(e.target.value)}
          placeholder="Name"
          style={{ display: 'block', marginBottom: '0.5rem' }}
        />

        <input
          value={manualLat}
          onChange={(e) => setManualLat(e.target.value)}
          placeholder="Latitude"
          style={{ display: 'block', marginBottom: '0.5rem' }}
        />

        <input
          value={manualLng}
          onChange={(e) => setManualLng(e.target.value)}
          placeholder="Longitude"
          style={{ display: 'block', marginBottom: '0.5rem' }}
        />

        <button onClick={saveManualPlace}>Save Manual Place</button>
      </div>

      {selectedPlace && (
        <p style={{ marginTop: '1rem' }}>
          Saved place: <strong>{selectedPlace.name}</strong>
        </p>
      )}

      {/* Product form */}
      <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ddd' }}>
        <h3>Add Product</h3>

        <input
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Product name"
          style={{ display: 'block', marginBottom: '0.5rem' }}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ display: 'block', marginBottom: '0.5rem' }}
        >
          <option value="matcha">Matcha</option>
          <option value="tea">Tea</option>
          <option value="other">Other</option>
        </select>

        <input
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="Origin"
          style={{ display: 'block', marginBottom: '0.5rem' }}
        />

        <input
          value={tasteNotes}
          onChange={(e) => setTasteNotes(e.target.value)}
          placeholder="Taste notes"
          style={{ display: 'block', marginBottom: '0.5rem' }}
        />

        <input
          value={amazonUrl}
          onChange={(e) => setAmazonUrl(e.target.value)}
          placeholder="Amazon URL (optional)"
          style={{ display: 'block', marginBottom: '0.5rem' }}
        />

        <button onClick={saveProduct}>Save Product</button>
      </div>
    </div>
  );
}