import { serverTimestamp } from "firebase/firestore";

export const Relationship = {
  name: "",
   created: {
      date: serverTimestamp(),
      user:'',
    },
    updated: []
}  