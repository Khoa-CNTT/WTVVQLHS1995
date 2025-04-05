import styles from './LoginPage.module.css'; // Import CSS module nếu cần

function LoginPage() {
  return (
    <div className={styles.container}>
      <h1>Login Page</h1>
      <button onClick={() => localStorage.setItem('token', 'example-token')}>
        Simulate Login
      </button>
    </div>
  );
}

export default LoginPage;