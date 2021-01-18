import { useState, useEffect } from 'react';
import { getDestinyManifest, getDestinyManifestSlice, HttpClient, HttpClientConfig } from 'bungie-api-ts/destiny2';
import DataGrid from 'react-data-grid';
import 'react-data-grid/dist/react-data-grid.css';
import './App.css';

const $http: HttpClient = async (config: HttpClientConfig) => {
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

interface DTO {
    type: string;
    name: string;
    description: string;
    powerCap: number;
    season: number;
    tierTypeName: string | undefined;
}

function App() {
    const [items, setItems] = useState<DTO[]>([]);

    useEffect(() => {
        async function getData() {
            const res = await fetch('https://raw.githubusercontent.com/DestinyItemManager/DIM/master/src/data/d2/lightcap-to-season.json');
            const cap2season: { [key: string]: number } = await res.json();


            const destinyManifest = await getDestinyManifest($http);
            const manifestTables = await getDestinyManifestSlice($http, {
                destinyManifest: destinyManifest.Response,
                tableNames: ['DestinyInventoryItemDefinition', 'DestinyItemCategoryDefinition', 'DestinyPowerCapDefinition', 'DestinySeasonDefinition'],
                language: 'en'
            });

            console.log(manifestTables.DestinySeasonDefinition);

            const categoryHashes = Object.values(manifestTables.DestinyItemCategoryDefinition)
                .filter(def => ["Weapon", "Armor"].includes(def.shortTitle))
                .map(def => def.hash);

            const tiers = [
                5, // legendary
                6, // exotic
            ];

            const arr = Object.values(manifestTables.DestinyInventoryItemDefinition)
                .filter(def => def.itemCategoryHashes?.some(hash => categoryHashes.includes(hash)) && tiers.includes(def.inventory?.tierType ?? 0)) // is a legendary/exotic armor or weapon
                .flatMap(def =>
                    def.quality?.versions.map(ver => {
                        const { displayProperties: { name, description }, inventory, itemCategoryHashes } = def;

                        const { powerCap } = manifestTables.DestinyPowerCapDefinition[ver.powerCapHash];

                        if (!inventory)
                            console.error("Item has no inventory data", def, ver);

                        return {
                            type: itemCategoryHashes?.includes(categoryHashes[0]) ? 'Weapon' : 'Armor',
                            name,
                            description,
                            powerCap,
                            season: cap2season[`${powerCap}`],
                            tierTypeName: inventory?.tierTypeName,
                        };
                    })
                )
                .filter(dto => !!dto) as DTO[];
            // see 718 and DestinySeasonDefinition 7301

            setItems(arr);
        }

        getData();
    }, []);

    return (
        <DataGrid
            columns={[
                { key: 'type', name: 'type' },
                { key: 'name', name: 'name' },
                { key: 'description', name: 'description' },
                { key: 'powerCap', name: 'powerCap' },
                { key: 'season', name: 'season' },
                { key: 'tierTypeName', name: 'tierTypeName' },
            ]}
            rows={items.map((dto, id) => ({ id, ...dto }))}
            defaultColumnOptions={{
                sortable: true,
            }}
        />
    );
}

export default App;
