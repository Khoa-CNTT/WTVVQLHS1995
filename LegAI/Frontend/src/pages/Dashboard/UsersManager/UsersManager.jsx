import styles from './UsersManagerPage.module.css'; // Import CSS module nếu cần

function UsersManagerPage() {
  return (
    <div className={styles.container}>
      <h1>UsersManager Page</h1>
      <button onClick={() => localStorage.setItem('token', 'example-token')}>
        Simulate UsersManager
      </button>
    </div>
  );
}

export default UsersManagerPage;