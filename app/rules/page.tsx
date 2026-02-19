import styles from './page.module.css'

export default function RulesPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Rules</h1>
        <div className={styles.content}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Putting League Rules</h2>
            <p className={styles.text}>
              Welcome to the Putting League! Here are the rules and guidelines
              for participation.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>General Rules</h2>
            <ul className={styles.list}>
              <li>Each season consists of 10 weeks.</li>
              <li>Each week consists of 4 rounds of 10 putts each from distances of 20, 25, 30, and 35 feet and 1 Bonus Round.</li>
              <li>Each week, one putting distance is replace with an Obstacle Putt. The Obstacle Putt is a putt determined by a wheel spin to determine a distance and putt style for the week.</li>
              <li>Each week, all players draw a card that can positively or negatively affect their score for the week.</li>
              <li>Cards are not allowed to be used in the Bonus Round.</li>
              <li>Respectful conduct is required at all times.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Bonus Round</h2>
            <ul className={styles.list}>
              <li>The Bonus Round putt is a putt determined on and voted on by the chat.</li>
              <li>The maximum number of points available in the Bonus Round must be 30 points. </li>
              <li>The number of points awarded for the Bonus Round putt is determined by the chat.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Schedule</h2>
            <p className={styles.text}>
              Matches are held weekly. Check the schedule for specific dates and
              times. Participants must arrive 15 minutes before their scheduled
              tee time.
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Contact</h2>
            <p className={styles.text}>
              For questions or concerns, please contact the league administrator
              through the official channels.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
