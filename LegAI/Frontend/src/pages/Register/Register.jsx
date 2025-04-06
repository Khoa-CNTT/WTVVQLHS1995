import styles from './RegisterPage.module.css'; // Import CSS module nếu cần

function RegisterPage() {
  return (
    <div className={styles.container}>
      <h1>Register Page</h1>
      <button onClick={() => localStorage.setItem('token', 'example-token')}>
        Simulate Register
      </button>
    </div>
  );
}

export default RegisterPage;