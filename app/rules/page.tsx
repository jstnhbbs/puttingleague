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
              <li>Each participant must follow the official putting guidelines</li>
              <li>All putts must be taken from the designated starting position</li>
              <li>Participants are responsible for accurate score reporting</li>
              <li>Respectful conduct is required at all times</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Scoring</h2>
            <ul className={styles.list}>
              <li>Scores are recorded on the official scorecards</li>
              <li>Each round consists of 18 holes</li>
              <li>The lowest total score wins</li>
              <li>Ties will be decided by a playoff round</li>
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
