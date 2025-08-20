import { motion } from 'framer-motion';
import { VentaForm } from '@/components/ventas/VentaForm';
import Layout from '@/components/layout/Layout';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export const Vender = () => {
  return (
    <Layout>
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants}>
          <VentaForm />
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default Vender;