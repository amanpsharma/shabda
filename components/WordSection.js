export default function WordSection({ word, lang, secondary = false }) {
  const data = word[lang];
  return (
    <div className={`word-section${secondary ? " secondary" : ""}`}>
      <div className="pos">{data.pos}</div>
      {lang === "en" ? (
        <>
          <div className="word-en">{data.word}</div>
          <div className="phonetic">{data.phonetic}</div>
        </>
      ) : (
        <>
          <div className="word-hi">{data.word}</div>
          <div className="romanized">{data.romanized}</div>
        </>
      )}
    </div>
  );
}
