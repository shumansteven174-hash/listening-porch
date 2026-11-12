// Daily Light library — 30 quotes, 30 spiritual readings, 30 original poems.
// Quotes are short, attributed quotations from public-domain or widely quoted
// sources. Poems and readings are original, written for The Listening Porch.

const QUOTES = [
  { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", by: "Marcus Aurelius" },
  { text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", by: "The Buddha" },
  { text: "The wound is the place where the Light enters you.", by: "Rumi" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", by: "Ralph Waldo Emerson" },
  { text: "It is not the load that breaks you down, it is the way you carry it.", by: "Lou Holtz" },
  { text: "He who has a why to live can bear almost any how.", by: "Friedrich Nietzsche" },
  { text: "Everything that is done in the world is done by hope.", by: "Martin Luther" },
  { text: "The best way out is always through.", by: "Robert Frost" },
  { text: "No one can make you feel inferior without your consent.", by: "Eleanor Roosevelt" },
  { text: "When we are no longer able to change a situation, we are challenged to change ourselves.", by: "Viktor E. Frankl" },
  { text: "Hope is the thing with feathers that perches in the soul.", by: "Emily Dickinson" },
  { text: "A journey of a thousand miles begins with a single step.", by: "Lao Tzu" },
  { text: "The sun himself is weak when he first rises, and gathers strength and courage as the day gets on.", by: "Charles Dickens" },
  { text: "Out of difficulties grow miracles.", by: "Jean de La Bruyère" },
  { text: "We are all in the gutter, but some of us are looking at the stars.", by: "Oscar Wilde" },
  { text: "Courage doesn't always roar. Sometimes courage is the quiet voice at the end of the day saying, 'I will try again tomorrow.'", by: "Mary Anne Radmacher" },
  { text: "The darkest hour is just before the dawn.", by: "Thomas Fuller" },
  { text: "Turn your wounds into wisdom.", by: "Oprah Winfrey" },
  { text: "You can't calm the storm, so stop trying. Calm yourself. The storm will pass.", by: "Timber Hawkeye" },
  { text: "It does not matter how slowly you go as long as you do not stop.", by: "Confucius" },
  { text: "We must accept finite disappointment, but never lose infinite hope.", by: "Martin Luther King Jr." },
  { text: "Peace comes from within. Do not seek it without.", by: "The Buddha" },
  { text: "Even the darkest night will end and the sun will rise.", by: "Victor Hugo" },
  { text: "Holding on to anger is like grasping a hot coal with the intent of throwing it at someone else; you are the one who gets burned.", by: "The Buddha" },
  { text: "Fall seven times, stand up eight.", by: "Japanese proverb" },
  { text: "You are not a drop in the ocean. You are the entire ocean in a drop.", by: "Rumi" },
  { text: "Be kind, for everyone you meet is fighting a harder battle.", by: "Ian Maclaren" },
  { text: "Difficult roads often lead to beautiful destinations.", by: "Anonymous" },
  { text: "This too shall pass.", by: "Persian proverb" },
  { text: "There is no exercise better for the heart than reaching down and lifting people up.", by: "John Holmes" },
];

const READINGS = [
  { title: "The Porch Light", text: "A porch light does not chase away the whole night. It only says: someone is home, someone is awake, and you are welcome to sit a while. Be that light for someone today — even if the light you can offer is small." },
  { title: "Breath Is Enough", text: "When everything feels too heavy, come back to the simplest thing you own: one breath in, one breath out. You do not have to fix the whole of your life in this moment. You only have to breathe through this one." },
  { title: "Held, Not Fixed", text: "We are not called to fix one another. We are called to sit beside one another and hold the weight together. A burden shared is not a burden solved — but it is a burden that no longer has to be carried alone." },
  { title: "The Morning After", text: "Night can make a problem feel permanent. Morning rarely agrees. Whatever kept you awake, give it until daylight before you decide what it means. Most storms look smaller in the sun." },
  { title: "Small Steps Count", text: "Getting out of bed counts. Drinking a glass of water counts. Answering one message counts. Healing is not a leap; it is a long road walked one small, ordinary step at a time." },
  { title: "You Are Not Your Worst Day", text: "The worst thing you have ever done, the worst day you have ever had — neither one is the whole of you. You are also every kindness you have shown, every morning you got up anyway, every time you chose to keep going." },
  { title: "Grace for Yourself", text: "You would not speak to a friend the way you speak to yourself on your hardest days. Try, just today, to offer yourself the same gentleness you so freely give to others. You deserve your own kindness too." },
  { title: "The Listening Heart", text: "Most people do not need advice. They need a person who will listen all the way to the end of the sentence without reaching for a solution. Listening is one of the bravest kinds of love there is." },
  { title: "Roots and Rain", text: "A tree does not apologize for needing rain, and it does not grow faster by force. It stands, it drinks, it waits. Your season of growth is coming, even if today only feels like rain." },
  { title: "Carrying and Letting Go", text: "Some weights we carry because we must. Others we carry because we have forgotten we are allowed to set them down. Today, notice one thing you have been carrying that was never yours to hold — and practice setting it down." },
  { title: "The Quiet Hour", text: "There is a kind of healing that only happens in quiet. Not in noise, not in answers — in the still hour when you stop performing and simply are. Give yourself ten quiet minutes today. That is enough." },
  { title: "Worth Beyond Work", text: "Your worth is not measured by what you produce, how much you earn, or how useful you feel on a given day. You are worth listening to because you are a person, full stop. Rest is not something you have to earn." },
  { title: "The Second Wind", text: "Long-distance runners talk about the second wind — the moment when the body, spent and certain it cannot go on, finds new strength it did not know it had. Hearts have second winds too. Keep walking; yours is coming." },
  { title: "An Open Door", text: "Help does not always arrive as a rescue. Sometimes it arrives as an open door, a chair pulled out, a cup of coffee, a person who says, 'Tell me about it.' Keep your door open — to others, and to yourself." },
  { title: "Grief Has No Deadline", text: "Grief does not follow a calendar. It comes back on birthdays, on ordinary Tuesdays, in songs on the radio. That does not mean you are going backwards. It means you loved someone, and love does not expire." },
  { title: "The Hand You Cannot See", text: "In the darkest stretches, it can feel like no one is there. But there are hands reaching toward you that you cannot see yet — in this community, in a helpline, in a friend you have not called. Reach back. Someone is waiting to hold on." },
  { title: "Forgiveness, Slowly", text: "Forgiveness is not a single decision; it is a practice you return to, sometimes daily. You do not have to forgive anyone today. You only have to be willing to consider that one day, you might — and that the weight would lift." },
  { title: "The Candle", text: "A candle does not lose anything by lighting another candle. Neither do you. The kindness you give away is not subtracted from your own supply. Light shared is light doubled." },
  { title: "When Words Fail", text: "Sometimes there are no words for what hurts. That is alright. Sit with someone who does not need you to explain. A shared silence can be more healing than a thousand well-meant sentences." },
  { title: "The Long Road Home", text: "Coming home to yourself takes time. You may have been away for years, living in other people's expectations. The porch light is on. The door is unlocked. You are allowed to come back, exactly as you are." },
  { title: "Strength in Asking", text: "Asking for help is not weakness. It is the moment strength changes shape — from holding everything alone to trusting someone else with a piece of it. The strongest people you know have asked for help. So can you." },
  { title: "Today Is Enough", text: "You do not have to have the next five years figured out. You do not even have to have tomorrow figured out. Today — this hour, this breath — is the only ground you have to stand on, and it is enough." },
  { title: "The River", text: "A river does not fight the stones in its path. It flows around them, over them, and in time it wears them smooth. You do not have to defeat every obstacle today. You only have to keep flowing." },
  { title: "Seeds Under Snow", text: "In winter, a garden looks finished. But under the snow, seeds are waiting. Your life is not over because it is quiet right now. Something is growing where you cannot see it yet." },
  { title: "The Friend You Are", text: "Think of the friend you are to others — patient, loyal, quick to forgive. Now imagine turning that friendship toward yourself. You have been a good friend to so many. It is time to be one to you." },
  { title: "Light Through the Cracks", text: "A broken cup still holds water. A cracked window still lets the light through. You do not have to be whole to be useful, or unbroken to be loved. The cracks are where the light gets in." },
  { title: "One Person", text: "You do not need to save the world today. You only need to be kind to one person — including yourself. One conversation, one honest sentence, one small act of care. That is how the world gets saved: one person at a time." },
  { title: "The Night Watch", text: "Some nights, the only job is to stay until morning. Not to solve, not to understand — just to stay. If tonight is one of those nights, stay. Morning is coming, and it has never once failed to arrive." },
  { title: "Begin Again", text: "Every sunrise is a small permission to begin again. Yesterday's mistakes do not get a vote in today's choices unless you hand them one. Today is new ground. Walk on it gently." },
  { title: "The Porch", text: "A porch is not inside and it is not outside. It is the in-between place — where you can sit with your thoughts and still be part of the world. That is what this place is for: a seat in the in-between, until you are ready to step back in." },
];

const POEMS = [
  { title: "Porch Light", lines: ["The porch light hums a soft hello,", "a small gold square against the night.", "It does not ask you where you've been —", "it only says: come sit in the light."] },
  { title: "Morning, Again", lines: ["The kettle sings, the sparrows start,", "the world begins its daily art.", "Whatever night has done to you,", "the morning starts the heart anew."] },
  { title: "Rain on the Roof", lines: ["Rain on the roof, a steady song,", "telling the tired: rest, belong.", "The roof holds firm, the walls hold fast —", "this heavy weather will not last."] },
  { title: "The Long Walk", lines: ["One foot, then one foot more,", "the road does not demand a run.", "The longest walks are won this way —", "a step, a breath, and then the sun."] },
  { title: "Hands", lines: ["These hands have held both joy and grief,", "have built, have broken, found relief.", "They open now, they are not fists —", "they are the place where help exists."] },
  { title: "The Old Oak", lines: ["The old oak lost a limb last spring,", "and still it stands, and still birds sing.", "It did not heal by hurrying —", "it healed by standing, patiently."] },
  { title: "Kitchen Table", lines: ["Two cups, one table, evening light,", "a friend who stays into the night.", "No answers offered, none required —", "just someone near, when you are tired."] },
  { title: "The River's Lesson", lines: ["The river bends but never breaks,", "it finds a way through every stone.", "It does not hurry, does not fight —", "it simply flows, and carries on."] },
  { title: "Dandelions", lines: ["They call them weeds, but children know:", "a wish is what you get to blow.", "Scatter your hopes into the air —", "the wind will take them everywhere."] },
  { title: "Night Shift", lines: ["At three a.m. the world is still,", "and worries grow against your will.", "But somewhere, someone is awake —", "you are not alone in the ache."] },
  { title: "The Seed", lines: ["Beneath the soil, unseen, unheard,", "a seed believes in spring's soft word.", "It cannot see the sun above —", "it grows on nothing but trust and love."] },
  { title: "Apology to Myself", lines: ["I'm sorry for the words I said,", "the ones that kept you up in bed.", "Today I speak a kinder line:", "you are enough, and you are mine."] },
  { title: "The Bridge", lines: ["Between the dark and morning's door,", "a narrow bridge of one step more.", "You do not need to see the end —", "just take the step, and then ascend."] },
  { title: "Grandmother's Quilt", lines: ["Each square a story, stitched with care,", "a patchwork of the love that's there.", "When nights are cold and hope is thin,", "wrap yourself in where you've been."] },
  { title: "The Lighthouse Keeper", lines: ["He tends the lamp through storm and rain,", "not for the ships that never came,", "but for the one, far out at sea,", "who needs to know: there's light for me."] },
  { title: "Breathing", lines: ["In through the nose, a slow, deep tide,", "out through the mouth, let fear subside.", "The body knows what hearts forget —", "this breath is yours, and you are yet."] },
  { title: "The Empty Chair", lines: ["The chair is empty, yet it stays,", "a place for someone, always.", "Grief is love with nowhere to sit —", "so pull up close, and stay a bit."] },
  { title: "First Snow", lines: ["The first snow falls without a sound,", "and covers all the broken ground.", "It does not ask what came before —", "it only whispers: start once more."] },
  { title: "The Phone Call", lines: ["It took three tries to make the call,", "my voice was small, my courage small.", "But on the other end, a voice said,", "'I'm glad you called. I'm here. Stay.'"] },
  { title: "Garden", lines: ["I planted hope in rows of green,", "and watered it with tears unseen.", "It grows in silence, slow and true —", "the garden blooms because of you."] },
  { title: "The Window", lines: ["A window open to the rain,", "lets out the stale, lets in the plain,", "and what was heavy starts to lift —", "the smallest opening is a gift."] },
  { title: "Suitcase", lines: ["I packed my sorrows in a case,", "and set it down in this kind place.", "I do not have to carry all —", "some burdens answer to a call."] },
  { title: "The Choir", lines: ["One voice alone is soft and thin,", "but many voices, joining in,", "can lift a roof, can heal a hall —", "sing, and let the music call."] },
  { title: "Campfire", lines: ["The fire pops, the sparks ascend,", "and strangers slowly turn to friends.", "We came with nothing much to say —", "we stay because we found a way."] },
  { title: "The Letter", lines: ["Dear me, I write from years ahead,", "the worst is over, tears are shed,", "and you are standing, whole and free —", "keep going. Love, the future me."] },
  { title: "Moonrise", lines: ["The moon climbs slow above the pines,", "and silver threads the dark with lines.", "If such a light can rise each night,", "then so, my friend, can yours, in time."] },
  { title: "The Swing", lines: ["An empty swing moves in the breeze,", "remembering the knees and trees.", "It waits for laughter, waits for you —", "the joy you knew is coming too."] },
  { title: "Forgiveness", lines: ["I set the stone down on the shore,", "and watched the tide take it once more.", "It was not mine to carry home —", "I walk much lighter on my own."] },
  { title: "The Porch, At Dawn", lines: ["The porch at dawn, the coffee warm,", "the sky recovering from the storm.", "The night is done, the day begins —", "and somewhere, hope is settling in."] },
  { title: "For Anyone Listening", lines: ["If you are reading this alone,", "with heavy heart and weary bone,", "know this: the porch light burns for you,", "and morning always breaks through."] },
];

// Rotate by calendar date. Each day shows one entry; the category rotates
// quote -> reading -> poem -> quote ... by day number.
function dayNumber(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor(d.getTime() / 86400000);
}

function dailyLight(date = new Date()) {
  const n = dayNumber(date);
  const categories = ["quote", "reading", "poem"];
  const cat = categories[((n % 3) + 3) % 3];
  const list = cat === "quote" ? QUOTES : cat === "reading" ? READINGS : POEMS;
  const entry = list[((Math.floor(n / 3) % list.length) + list.length) % list.length];
  return { category: cat, entry, date: new Date(date.getFullYear(), date.getMonth(), date.getDate()) };
}

function dailyByCategory(date = new Date()) {
  const n = dayNumber(date);
  const idx = ((Math.floor(n / 3) % 30) + 30) % 30;
  return {
    quote: QUOTES[idx],
    reading: READINGS[idx],
    poem: POEMS[idx],
  };
}

module.exports = { QUOTES, READINGS, POEMS, dailyLight, dailyByCategory };
