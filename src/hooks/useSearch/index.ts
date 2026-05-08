// import { useState, useMemo } from "react";

// type SearchKey = string; // supports "name" or nested keys like "user.address.city"

// function getNestedValue(obj: any, path: string): any {
//   if (!obj || !path) return undefined;

//   // Normalize path (remove optional chaining symbols like ?. )
//   const keys = path
//     .replace(/\[(\w+)\]/g, ".$1") // Convert [0] to .0
//     .replace(/\?\./g, ".")        // Remove optional chaining
//     .split(".")
//     .filter(Boolean);             // Remove empty parts

//   return keys.reduce((acc, key) => {
//     if (acc && typeof acc === "object" && key in acc) {
//       return acc[key];
//     }
//     return undefined;
//   }, obj);
// }


// /**
//  * useSearch - Global reusable hook for searching in lists by one or more keys.
//  * Works for both flat keys ("name") and nested keys ("user.address.city").
//  */
// export function useSearch<T extends Record<string, any>>(list: T[] = [], keys: SearchKey[]) {
//   const [searchValue, setSearchValue] = useState("");

//   const filteredList = useMemo(() => {
    
//     if (!searchValue.trim()) return list;
//     const lowerQuery = searchValue.toLowerCase();
    

//     const data = list.filter((item) =>
//       keys.some((key) => {
     
//         const value = getNestedValue(item, key);
         
//         if (value === null || value === undefined) return false;
//         return String(value).toLowerCase().includes(lowerQuery);
//       })
//     );
//      return data
//   }, [list, searchValue, keys]);

//   return { searchValue, setSearchValue, filteredList };
// }


import { useState, useMemo } from "react";

/**
 * Supports:
 *  - "name"
 *  - "user.address.city"
 *  - "payments.invoice.residentData.personal.name"
 */
type SearchKey = string;

/* ======================================================
   Get all values from object by deep path (ARRAY SAFE)
====================================================== */
function getNestedValues(obj: any, path: string): any[] {
  if (!obj || !path) return [];

  const keys = path
    .replace(/\[(\w+)\]/g, ".$1") // [0] → .0
    .replace(/\?\./g, ".")        // remove optional chaining
    .split(".")
    .filter(Boolean);

  function traverse(current: any, index: number): any[] {
    if (current == null) return [];

    // ✔ Path fully resolved
    if (index === keys.length) {
      return Array.isArray(current) ? current : [current];
    }

    const key = keys[index];

    // ✔ If array → search every item
    if (Array.isArray(current)) {
      return current.flatMap(item => traverse(item, index));
    }

    // ✔ If object → move deeper
    if (typeof current === "object" && key in current) {
      return traverse(current[key], index + 1);
    }

    return [];
  }

  return traverse(obj, 0);
}

/* ======================================================
   useSearch Hook
====================================================== */
export function useSearch<T extends Record<string, any>>(
  list: T[] = [],
  keys: SearchKey[]
) {
  const [searchValue, setSearchValue] = useState('');

  const filteredList = useMemo(() => {
    // ✅ normalize search text (string + number safe)
    const query = String(searchValue ?? '').trim().toLowerCase();

    // ❌ empty search → return full list
    if (!query) return list;

    return list.filter(item =>
      keys.some(key => {
        const values = getNestedValues(item, key);

        return values.some(val =>
          val !== null &&
          val !== undefined &&
          String(val).toLowerCase().includes(query)
        );
      })
    );
  }, [list, searchValue, keys]);

  return {
    searchValue,
    setSearchValue,
    filteredList,
  };
}

