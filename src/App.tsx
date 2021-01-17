import { useState, useEffect } from 'react';
import { DestinyInventoryItemDefinition, getDestinyManifest, getDestinyManifestSlice, HttpClient, HttpClientConfig } from 'bungie-api-ts/destiny2';
import RJW from 'react-json-view';
import './App.css';

const $http: HttpClient = async (config: HttpClientConfig) => {
  // console.log(process.env.REACT_APP_API_KEY);
  const res = await fetch(
    // `https://cors-anywhere.herokuapp.com/${config.url}`
    config.url
    , {
    headers: {
      'X-API-Key': process.env.REACT_APP_API_KEY!,
    }
  });
  return res.json();
}

function App() {
  const [items, setItems] = useState({});

  useEffect(() => {
    async function getData() {
      const destinyManifest = await getDestinyManifest($http);
      const manifestTables = await getDestinyManifestSlice($http, {
        destinyManifest: destinyManifest.Response,
        tableNames: ['DestinyInventoryItemDefinition', 'DestinyItemCategoryDefinition'],
        language: 'en'
      });

      const categories = [
        // "Armor",
        "Weapon",
      ] as const

      const payload: { [key: string]: DestinyInventoryItemDefinition | undefined } = {};

      for (const cat of categories) {
        const hash = Object.values(manifestTables.DestinyItemCategoryDefinition).find(def => def.shortTitle === cat)?.hash;
        if (hash)
          payload[cat] = Object.values(manifestTables.DestinyInventoryItemDefinition).find(def => def.itemCategoryHashes?.includes(hash));
      }

      setItems(payload);
    }

    getData();
  }, []);

  return (
    <>
      <RJW src={items} />
    </>
  );
}

export default App;
