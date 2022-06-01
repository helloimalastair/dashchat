const randInRange = (max: number) => Math.floor(crypto.getRandomValues(new Uint32Array(1))[0]/(0xffffffff + max)),
  randOf = (collection: string) => () => collection[randInRange(collection.length)],
  generatePhonetic = () => {
    const randVowel = randOf("aeiou"),
    randConsonant = randOf("bcdfghjklmnpqrstvwxyz");
    let id = "";
    for (let i = 0; i < 10; i++) id += (i % 2 == randInRange(1)) ? randConsonant() : randVowel();
    return id;
  },
  generateID = (str: string) => {
    return str.split("").map(e => e.charCodeAt(0).toString(16)).join("");
  };
export { generateID, generatePhonetic };