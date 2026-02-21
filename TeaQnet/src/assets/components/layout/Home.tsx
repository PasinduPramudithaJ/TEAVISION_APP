import React from 'react';
import Header from './Header';
import Footer from './Footer';
import Contend from './Contend';

const Home: React.FC = () => {
    return (
        <>
            <div>
                <Header />
                <Contend />
                <Footer />
            </div>
        </>
    );
};

export default Home;