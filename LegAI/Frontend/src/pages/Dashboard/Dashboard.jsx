function Dashboard() {
    return (
      <div>
        <h1>Dashboard</h1>
        <button onClick={() => localStorage.removeItem('token')}>
          Logout
        </button>
      </div>
    );
  }
  
  export default Dashboard;