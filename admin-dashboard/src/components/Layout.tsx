import { Box, Container } from '@chakra-ui/react'
import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.xl">
        {children}
      </Container>
    </Box>
  )
}
