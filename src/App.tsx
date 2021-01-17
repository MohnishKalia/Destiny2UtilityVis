import { useState, useEffect } from 'react';
import { DestinyInventoryItemDefinition, getDestinyManifest, getDestinyManifestSlice, HttpClient, HttpClientConfig, TierType } from 'bungie-api-ts/destiny2';
import RJW from 'react-json-view';
import './App.css';

const $http: HttpClient = async (config: HttpClientConfig) => {
  // console.log(process.env.REACT_APP_API_KEY);
  const res = await fetch(
    `https://cors-anywhere.herokuapp.com/${config.url}`
    // config.url
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
        tableNames: ['DestinyInventoryItemDefinition', 'DestinyItemCategoryDefinition', 'DestinyPowerCapDefinition'],
        language: 'en'
      });

      const categories = [
        "Armor",
        "Weapon",
      ] as const

      const tiers = [
        5, // legendary
        6, // exotic
      ];

      const payload: { [key: string]: any } = {};

      for (const cat of categories) {
        const hash = Object.values(manifestTables.DestinyItemCategoryDefinition).find(def => def.shortTitle === cat)?.hash;
        if (hash)
          payload[cat] = Object.values(manifestTables.DestinyInventoryItemDefinition)
            .filter(def => def.itemCategoryHashes?.includes(hash) && tiers.includes(def.inventory?.tierType ?? 0))
            .map(def => ({
              name: def.displayProperties.name,
              description: def.displayProperties.description,
              quality: def.quality?.versions.map(ver => manifestTables.DestinyPowerCapDefinition[ver.powerCapHash].powerCap),
              tierType: def.inventory?.tierTypeName,
            }));
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
