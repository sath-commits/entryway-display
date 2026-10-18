// Fact / quote / word banks for the rotating "Daily Three" widget.
// Facts rotate by weekday category (Wednesday is Tamil language &
// culture in this family's edition — edit freely). Quotes are short
// classics; words alternate English curiosities and Tamil words
// with transliteration. Picks are deterministic by local date, so
// everyone sees the same ones all day. Edit the banks to taste.
var CATEGORY_LABELS = {
  science: "Science",
  history: "History & Geography",
  tamil: "Tamil Language & Culture",
  space: "Space",
  animals: "Animals & Nature",
  inventions: "How Things Work",
  math: "Math Puzzle",
};
var CATEGORY_BY_WEEKDAY = [
  "math",
  "science",
  "history",
  "tamil",
  "space",
  "animals",
  "inventions",
];
var FACTS = {
  science: [
    {
text: "Honey never spoils. Archaeologists found pots of honey in Egyptian tombs that are about 3,000 years old — and still good to eat. Honey has almost no water in it, and bacteria can't grow in it.",
dinner: "What food in our kitchen do you think would last the longest? Why?",
    },
    {
text: "An octopus has three hearts and blue blood. Two hearts pump blood to its gills, and the third pumps it to the rest of its body — and that third heart stops beating when the octopus swims.",
dinner: "If you could have one animal superpower, what would it be?",
    },
    {
text: "Hot water can sometimes freeze faster than cold water. Scientists call this the Mpemba effect, and they still argue about exactly why it happens.",
dinner: "How would you design an experiment to test this at home?",
    },
    {
text: "Botanically, bananas are berries — but strawberries are not. A true berry must grow from a flower with one ovary, and bananas do; strawberries grow from a flower with many.",
dinner: "What other fruit do you think might secretly be a berry?",
    },
    {
text: "The Eiffel Tower grows taller in summer. When the iron heats up in the sun it expands, and the tower ends up about 15 centimetres — six inches — taller than in winter.",
dinner: "What else around our house changes size when it gets hot or cold?",
    },
    {
text: "Sound travels about 4.3 times faster through water than through air. That's why whales can 'sing' to each other across whole oceans.",
dinner: "Why do you think it's so hard to tell where a sound comes from when you're underwater in a pool?",
    },
    {
text: "A bolt of lightning is about five times hotter than the surface of the Sun. The Sun's surface is roughly 5,500°C; a lightning channel can reach 30,000°C.",
dinner: "What safety rules should we follow in a thunderstorm?",
    },
    {
text: "Your body makes about 25 million new cells every second. In the time it took to read this fact, you made roughly 200 million new cells.",
dinner: "Which part of your body do you think replaces its cells the fastest?",
    },
    {
text: "There are more possible games of chess than there are atoms in the observable universe. The number of possible chess games is about 10^120; the atoms are 'only' about 10^80.",
dinner: "Would you rather be a chess grandmaster or an astronaut? Why?",
    },
  ],
  history: [
    {
text: "Oxford University is older than the Aztec Empire. Teaching began at Oxford in 1096; the Aztec capital Tenochtitlan was founded in 1325, more than 200 years later.",
dinner: "What's the oldest thing you've ever seen in real life?",
    },
    {
text: "If you joined together every branch and old section of the Great Wall of China, it would stretch more than 21,000 kilometres — halfway around the Earth.",
dinner: "What's the longest walk you've ever done? How far do you think you could walk in a day?",
    },
    {
text: "Africa is the only continent on Earth that sits in all four hemispheres — north, south, east and west all at once.",
dinner: "Can you name a continent that sits only in the southern hemisphere?",
    },
    {
text: "Russia's Lake Baikal holds about one-fifth of all the fresh surface water on the planet — more than all of North America's Great Lakes combined.",
dinner: "Where does the water in our taps come from, do you think?",
    },
    {
text: "The first oranges weren't orange. Oranges grew first in Southeast Asia, where the ripe fruit stayed green. Orange oranges came later, from breeding and cooler climates.",
dinner: "What other food has a colour in its name that doesn't always match?",
    },
    {
text: "Mount Rainier, which we can see from near our home on clear days, is the most glacier-covered peak in the contiguous United States. Its ice cap is bigger than the rest of the Cascade volcanoes' ice combined at times.",
dinner: "What would you pack for a hike partway up a snowy mountain?",
    },
    {
text: "Some Roman concrete has survived 2,000 years — including in the sea. Seawater actually makes Roman concrete stronger over time, because minerals grow inside its cracks and seal them.",
dinner: "What thing from today do you think people might still find in 2,000 years?",
    },
    {
text: "Ships crossing the Panama Canal are lifted 26 metres above sea level by locks, cross a lake, and are lowered down the other side. The locks work using gravity and water — no pumps lift the ships.",
dinner: "Why do you think they built the canal instead of just sailing around South America?",
    },
    {
text: "The Sahara Desert is almost as big as the whole United States. And Antarctica is technically the largest desert of all, because a desert is defined by how little rain or snow falls, not by heat.",
dinner: "Would you rather spend a week in the Sahara or in Antarctica?",
    },
  ],
  tamil: [
    {
text: "Tamil is one of the oldest living languages in the world. Poems written in Tamil more than 2,000 years ago — the Sangam poems — are still read and studied today, and Tamil is still spoken by tens of millions of people.",
dinner: "What's the oldest story or song in our family that you know?",
    },
    {
text: "The English word 'catamaran' — a boat with two hulls — comes from the Tamil words 'kattu maram', meaning 'tied logs'. Tamil fishermen built boats from logs tied together, and the name sailed around the world.",
dinner: "What other English words do you know that came from another language?",
    },
    {
text: "Tamil has a sound almost no other language has: 'zha', written ழ. It appears in the word 'Tamil' itself — Tamil is really pronounced 'Tamizh'.",
dinner: "Can everyone at the table say 'Tamizh' with the deep zha sound?",
    },
    {
text: "The word 'mango' travelled from Tamil to the whole world. It comes from 'māṅkāy' (mān = mango tree, kāy = unripe fruit), which Portuguese traders carried home, and it became 'manga', then 'mango'.",
dinner: "What's your favourite way to eat a mango?",
    },
    {
text: "More than a thousand years ago, ships of the Tamil Chola kings sailed across the ocean to Southeast Asia. The Cholas built the Brihadeeswara Temple in the year 1010 — its top stone weighs about 80 tons, as much as a dozen elephants.",
dinner: "How do you think builders lifted an 80-ton stone to the top with no cranes?",
    },
    {
text: "The English word 'curry' most likely comes from the Tamil word 'kari', which means a spiced sauce or the curry leaf. The word travelled with trade ships from Tamil Nadu to kitchens everywhere.",
dinner: "What's the tastiest kari you've ever had, and who made it?",
    },
    {
text: "Tamil is an official language in three countries: India, Sri Lanka and Singapore. In Singapore you'll see Tamil on street signs and hear it on the train announcements, alongside English, Malay and Mandarin.",
dinner: "How many languages can our family say 'hello' in?",
    },
    {
text: "The Thirukkural is a Tamil book of wisdom written roughly 2,000 years ago. It has exactly 1,330 tiny poems — each one just two lines long — about kindness, learning, family and doing the right thing.",
dinner: "If you could write a two-line poem of advice, what would it say?",
    },
    {
text: "Some word experts think the English word 'anaconda' began as a Tamil phrase, 'ānai kondān' — 'the one who killed an elephant'. The word travelled through Sri Lanka and changed shape along the way.",
dinner: "Which snake would you name after an animal it could defeat?",
    },
  ],
  space: [
    {
text: "A day on Venus lasts longer than a year on Venus. Venus spins so slowly that it takes 243 Earth days to rotate once, but only 225 Earth days to go around the Sun.",
dinner: "On Venus, would your birthday come before the end of one day? Work it out!",
    },
    {
text: "Saturn is so light for its size that it would float in water. It's the only planet in our solar system less dense than water — you'd just need a bathtub about 120,000 kilometres wide.",
dinner: "What other everyday things float, and what makes them float?",
    },
    {
text: "Astronauts' footprints on the Moon will stay there for millions of years. The Moon has no wind and no rain, so nothing erases them — the first footprints from 1969 look almost new.",
dinner: "If you could leave one object on the Moon, what would it be?",
    },
    {
text: "Astronauts on the International Space Station see 16 sunrises and 16 sunsets every single day. The station races around Earth at 28,000 km/h and completes an orbit every 93 minutes.",
dinner: "Would you like a day with 16 sunrises? What would be tricky about it?",
    },
    {
text: "Jupiter's Great Red Spot is a storm wider than the entire Earth — and it has been raging for hundreds of years. It has shrunk over time, but it is still the biggest storm in the solar system.",
dinner: "What's the biggest storm you've ever experienced? What was it like?",
    },
    {
text: "Venus is the hottest planet, even though Mercury is closer to the Sun. Venus is wrapped in a thick atmosphere that traps heat like a blanket, pushing its surface to about 465°C — hot enough to melt lead.",
dinner: "Why does a blanket keep you warm? Is Venus's atmosphere doing the same thing?",
    },
    {
text: "A teaspoon of a neutron star would weigh about a billion tons. Neutron stars are the squashed cores of exploded giant stars, packed tighter than anything else in the universe except black holes.",
dinner: "What's the heaviest thing you can lift? How many of those would make a billion tons?",
    },
    {
text: "India's Mangalyaan spacecraft reached Mars in 2014 on the very first try — something no country had done before. The mission famously cost less than making a big Hollywood space movie.",
dinner: "If you could send a spacecraft anywhere, where would you send it and what would it look for?",
    },
    {
text: "There are more stars in the universe than grains of sand on all the beaches on Earth. Scientists estimate about 200 billion trillion stars — that's a 2 followed by 23 zeros.",
dinner: "How would you even begin to count the grains of sand on one beach?",
    },
  ],
  animals: [
    {
text: "Sea otters hold hands while they sleep so they don't drift away from each other. They also wrap themselves in kelp as an anchor. Sea otters live in the cold Pacific waters right off our Washington coast.",
dinner: "What animal would you most like to see in the wild near our home?",
    },
    {
text: "A group of flamingos is called a flamboyance. A group of owls is a parliament, a group of crows is a murder — and a group of pandas is an embarrassment.",
dinner: "Invent a group name for something: what would you call a group of toddlers?",
    },
    {
text: "Wombats poop cubes. Their cube-shaped droppings don't roll away, so wombats can stack them to mark their territory on rocks and logs.",
dinner: "Why do you think so many animal shapes are round instead of square?",
    },
    {
text: "Hummingbirds are the only birds that can fly backwards. Their wings beat up to 80 times per second and rotate in a figure-eight, which also lets them hover perfectly still at a flower.",
dinner: "If you could fly like any bird, which bird's style would you pick?",
    },
    {
text: "Trees in a forest share food and warnings through an underground network of fungi connected to their roots. Older 'mother trees' even send extra nutrients to young seedlings growing in their shade.",
dinner: "Do you think a forest is more like one creature or many? Why?",
    },
    {
text: "The banana slug — one of the largest slugs in the world, growing up to 25 cm long — makes its home in the damp forests of the Pacific Northwest. Its slime can numb the tongue of anything that tries to eat it.",
dinner: "What tiny creature near our home would you like to learn more about?",
    },
    {
text: "An axolotl, a salamander from Mexico, can regrow its legs, its tail, parts of its heart and even parts of its brain. Scientists study axolotls hoping to learn how healing works.",
dinner: "If your body could regrow one thing perfectly, what would you choose?",
    },
    {
text: "Some turtles can breathe through their backsides. They absorb oxygen from water through a special body part, which lets them stay underwater for days without coming up for air.",
dinner: "What's the longest you can hold your breath? Time it after dinner!",
    },
    {
text: "Cows have best friends. Studies show cows are calmer and happier with their favourite companion nearby — and they get stressed when they're separated from their friend.",
dinner: "How do you think scientists could tell which cow is another cow's best friend?",
    },
  ],
  inventions: [
    {
text: "The first computer programmer lived before computers existed. In the 1840s, Ada Lovelace wrote instructions for a machine that was only a design on paper — and her notes are considered the first computer program.",
dinner: "What machine that doesn't exist yet would you like to write instructions for?",
    },
    {
text: "Bubble wrap was invented to be wallpaper. In 1957 its inventors tried to sell it as fancy textured wall covering; only later did it become the world's favourite packaging — and popping toy.",
dinner: "What's something in our house being used for a different job than it was made for?",
    },
    {
text: "The microwave oven was discovered by accident. In 1945, engineer Percy Spencer noticed a chocolate bar in his pocket melted while he stood near radar equipment — so he tested popcorn next, and it popped.",
dinner: "What's the best accident that ever happened in our kitchen?",
    },
    {
text: "Velcro was copied from nature. A Swiss engineer, George de Mestral, found burrs stuck to his dog's fur in 1941, looked at them under a microscope, and saw tiny hooks — then spent years inventing a fabric version.",
dinner: "What else could we copy from an animal or a plant to solve a problem?",
    },
    {
text: "The first 1-gigabyte hard drive, made by IBM in 1980, weighed more than 200 kilograms and cost $40,000. Today a fingernail-sized card can hold a thousand times more.",
dinner: "How much storage do you think a phone will have when you're grown up?",
    },
    {
text: "LEGO bricks made in 1958 still click perfectly into bricks made today. The company kept the exact same brick design measurements for more than 65 years so that grandparents' LEGO works with yours.",
dinner: "What's the best thing you've ever built with LEGO or blocks?",
    },
    {
text: "The Wright brothers' first aeroplane flight in 1903 lasted 12 seconds — shorter than one wing of a Boeing 747 is long. In just 66 years, humans went from that 12-second hop to landing on the Moon.",
dinner: "What do you think flying will look like 66 years from now?",
    },
    {
text: "Post-it Notes came from a 'failed' glue. A scientist at 3M made an adhesive that was too weak — and years later a colleague who needed a bookmark that wouldn't tear his book pages realised weak glue was exactly right.",
dinner: "Can you think of a mistake that turned into something good?",
    },
    {
text: "Elevators are safe because of a demonstration in 1852: Elisha Otis stood on a platform high above a fair, ordered the rope cut — and his new safety brake stopped the fall after a few centimetres. Before that, nobody trusted elevators.",
dinner: "Would you have been brave enough to stand on Otis's platform?",
    },
  ],
  math: [
    {
text: "Paper-folding puzzle: a sheet of paper is about 0.1 mm thick. Fold it in half 7 times and it's as thick as a notebook. Fold it 42 times and the stack would reach all the way to the Moon. Doubling grows things unbelievably fast.",
dinner: "Guess: how many folds would it take to pass the Sun? (Answer: about 51!)" ,
    },
    {
text: "Try this pattern: 111,111,111 × 111,111,111 = 12,345,678,987,654,321. The answer climbs up 1-2-3-4-5-6-7-8-9 and comes back down again. It works for 11 × 11 and 111 × 111 too.",
dinner: "What do you think 1,111 × 1,111 is? Look for the pattern first, then check.",
    },
    {
text: "The volume of a pizza with radius 'z' and height 'a' is pi × z × z × a — which spells 'pizza'. Mathematicians love it when the formula is also a joke.",
dinner: "Can you invent a food whose name hides a math formula?",
    },
    {
text: "Zero is the only number that cannot be written in Roman numerals. The Romans had no symbol for nothing — the idea of zero as a number arrived in Europe from India, where mathematicians like Brahmagupta wrote rules for it 1,400 years ago.",
dinner: "Why do you think 'nothing' is such a hard idea that it took so long to invent?",
    },
    {
text: "Every odd number in English has the letter 'e' in it: one, three, five, seven, nine… and that stays true forever, because the '-teen' and '-ty' parts never remove the 'e' from the odd word at the end.",
dinner: "Test it: can anyone at the table find an odd number without an 'e'?",
    },
    {
text: "Shuffle a deck of 52 cards well, and the order you've made has almost certainly never existed before in history. There are more possible orders (52! — about 8 followed by 67 zeros) than there are atoms on Earth.",
dinner: "If every person on Earth shuffled a deck once a second, how long until orders repeated? (Longer than the age of the universe!)",
    },
    {
text: "A 'googol' is 1 followed by 100 zeros — a number so big that counting to it would take far longer than the age of the universe. The search engine Google is named after it (spelled slightly differently, by accident).",
dinner: "What's the biggest number you can name? Can you beat a googol?",
    },
    {
text: "Magic number: 21,978 × 4 = 87,912. Multiplying by 4 exactly reverses its digits! Numbers that flip like this are rare — mathematicians hunt for them like treasure.",
dinner: "Can you find a 2-digit number that reverses when multiplied by something?",
    },
    {
text: "There are exactly 2,598,960 different hands you can be dealt in 5-card poker. That's why getting the same hand twice in a row feels so surprising — it almost never happens by chance.",
dinner: "Which is rarer: being dealt the same card hand twice, or two people at this table sharing a birthday month? Guess, then reason it out.",
    },
  ],
};;

function factForDate(year, month, day) {
  var noonUtc = Date.UTC(year, month - 1, day, 12);
  var weekday = new Date(noonUtc).getUTCDay();
  var category = CATEGORY_BY_WEEKDAY[weekday] || "science";
  var bank = FACTS[category];
  var epochDays = Math.floor(noonUtc / 86400000);
  var weekCounter = Math.floor((epochDays - weekday) / 7);
  var index = ((weekCounter % bank.length) + bank.length) % bank.length;
  return { category: category, fact: bank[index] || bank[0] };
}

// Quote & word banks for the rotating Daily Three widget (added Oct 18, 2026
// at the user's request: one widget rotating fact / quote / word of the day).
// Quotes are short classics from long-dead authors or traditional proverbs.
// Words alternate English curiosities and Tamil words with transliteration.
var QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Kindness is the language which the deaf can hear and the blind can see.", author: "Mark Twain" },
  { text: "An early-morning walk is a blessing for the whole day.", author: "Henry David Thoreau" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Wherever you stand, be the soul of that place.", author: "Rumi" },
  { text: "Clouds come floating into my life, no longer to carry rain or usher storm, but to add color to my sunset sky.", author: "Rabindranath Tagore" },
  { text: "Whatever you are, be a good one.", author: "Abraham Lincoln" },
  { text: "The only thing worse than being blind is having sight but no vision.", author: "Helen Keller" },
  { text: "How wonderful it is that nobody need wait a single moment before starting to improve the world.", author: "Anne Frank" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { text: "Wisdom begins in wonder.", author: "Socrates" },
  { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "Life is like riding a bicycle. To keep your balance, you must keep moving.", author: "Albert Einstein" },
  { text: "Nothing in life is to be feared, it is only to be understood.", author: "Marie Curie" },
  { text: "Chance favors the prepared mind.", author: "Louis Pasteur" },
  { text: "Genius is one percent inspiration and ninety-nine percent perspiration.", author: "Thomas Edison" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius" },
  { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
  { text: "No act of kindness, no matter how small, is ever wasted.", author: "Aesop" },
  { text: "Even an elephant's foot can slip.", author: "Tamil proverb" },
  { text: "Fall seven times, stand up eight.", author: "Japanese proverb" },
  { text: "If you want to go fast, go alone. If you want to go far, go together.", author: "African proverb" },
  { text: "The best way to find yourself is to lose yourself in the service of others.", author: "Mahatma Gandhi" },
  { text: "Even if we lose everything else, we must not lose our courage.", author: "Bharathiar" },
  { text: "What lies within us matters more than what lies behind or before us.", author: "Ralph Waldo Emerson" },
  { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },
  { text: "A word spoken in anger can wound for a lifetime; choose soft words.", author: "Thiruvalluvar, in the Kural" },
];
var WORDS = [
  { word: "Petrichor", pron: "PET-ri-kor", meaning: "The earthy smell in the air after rain falls on dry ground.", example: "Stepping out after the storm, we breathed in the petrichor." },
  { word: "Apricity", pron: "a-PRIS-i-tee", meaning: "The warmth of the sun on a cold winter day.", example: "We stood in the doorway a moment, enjoying the apricity." },
  { word: "Anbu", pron: "AHN-boo · அன்பு (Tamil)", meaning: "Love, kindness and affection — the word Tamil families use for love that shows in actions.", example: "Grandma's cooking is pure anbu." },
  { word: "Serendipity", pron: "ser-en-DIP-i-tee", meaning: "Finding something wonderful when you weren't looking for it.", example: "Meeting our old neighbours at the market was pure serendipity." },
  { word: "Mazhai", pron: "MA-lai · மழை (Tamil)", meaning: "Rain.", example: "Mazhai is coming — take the rain jacket!" },
  { word: "Luminous", pron: "LOO-mi-nus", meaning: "Full of light; glowing softly.", example: "The luminous moon lit up the whole street." },
  { word: "Nilavu", pron: "ni-LA-vu · நிலவு (Tamil)", meaning: "The moon, and its gentle light.", example: "We watched the nilavu rise over the trees." },
  { word: "Halcyon", pron: "HAL-see-on", meaning: "Peaceful, calm and golden — like a perfect, quiet day.", example: "Summer holidays are our halcyon days." },
  { word: "Thenral", pron: "THEN-ral · தென்றல் (Tamil)", meaning: "A soft, gentle breeze from the south.", example: "The thenral cooled the whole veranda." },
  { word: "Mellifluous", pron: "mel-IF-loo-us", meaning: "Sweet and smooth, like honey — usually about a voice or music.", example: "Her mellifluous singing filled the hall." },
  { word: "Kadal", pron: "KA-dal · கடல் (Tamil)", meaning: "The sea, the ocean.", example: "The kadal near Chennai is warm all year." },
  { word: "Ebullient", pron: "i-BUL-yent", meaning: "Bubbling over with energy and cheerfulness.", example: "The ebullient puppy chased every leaf in the yard." },
  { word: "Vaazhthukkal", pron: "VAAZH-thu-kal · வாழ்த்துக்கள் (Tamil)", meaning: "Good wishes, greetings and congratulations.", example: "Vaazhthukkal! she said on my first day at the new job." },
  { word: "Gloaming", pron: "GLOH-ming", meaning: "The soft light just after sunset; twilight.", example: "We finished our walk in the gloaming." },
  { word: "Inimai", pron: "i-ni-MAI · இனிமை (Tamil)", meaning: "Sweetness — of taste, of music, of a kind voice.", example: "The inimai of the mangoes made everyone smile." },
  { word: "Solstice", pron: "SOL-stis", meaning: "The two days a year when the sun is farthest north or south — the longest and shortest days.", example: "After the winter solstice, the days slowly grow longer." },
  { word: "Agam", pron: "A-gam · அகம் (Tamil)", meaning: "The inside — home, heart and inner life; classical Tamil poetry's word for the world within.", example: "Agam is why home feels different from anywhere else." },
  { word: "Vivid", pron: "VIV-id", meaning: "Bright, strong and full of life, like a colour you can almost touch.", example: "The sunset turned the clouds a vivid orange." },
  { word: "Nimble", pron: "NIM-bul", meaning: "Quick and light on your feet — or quick in your thinking.", example: "The nimble squirrel leapt from branch to branch." },
  { word: "Jubilee", pron: "JOO-bi-lee", meaning: "A joyful celebration of a special anniversary.", example: "The whole street joined the jubilee." },
];
function quoteForDate(year, month, day) {
  var epochDays = Math.floor(Date.UTC(year, month - 1, day, 12) / 86400000);
  var i = ((epochDays % QUOTES.length) + QUOTES.length) % QUOTES.length;
  return QUOTES[i];
}
function wordForDate(year, month, day) {
  var epochDays = Math.floor(Date.UTC(year, month - 1, day, 12) / 86400000);
  var i = ((epochDays % WORDS.length) + WORDS.length) % WORDS.length;
  return WORDS[i];
}
